require('dotenv').config(); // 1. Cargar variables de entorno

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Aumentamos el límite para permitir el envío de imágenes en Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración de conexión a PostgreSQL usando variables de entorno
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Prevención de cierres inesperados por errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err.message);
});

// ==========================================
// 1. ENDPOINT DE LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
  let { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El correo y la contraseña son obligatorios'
    });
  }

  usuario = usuario.trim();

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexCorreo.test(usuario)) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El formato del correo electrónico no es válido'
    });
  }

  if (password.length < 4) {
    return res.status(400).json({
      exito: false,
      mensaje: 'La contraseña debe tener al menos 4 caracteres'
    });
  }

  try {
    const resultado = await pool.query(
      'SELECT id_usuario, nombre, correo, rol, activo FROM usuario WHERE correo = $1 AND password = $2',
      [usuario, password]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const usuarioEncontrado = resultado.rows[0];

    if (!usuarioEncontrado.activo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Tu cuenta esta desactivada. Contacta al administrador.'
      });
    }

    res.json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      usuario: usuarioEncontrado
    });

  } catch (error) {
    console.error('Error en la consulta de login:', error.message);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
});


// ==========================================
// 2. ENDPOINTS DE EMPLEADOS (CRUD)
// ==========================================

// GET: Obtener lista completa de empleados
app.get('/api/empleados', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM empleados ORDER BY id_empleado DESC');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener empleados:', error.message);
    res.status(500).json({ mensaje: 'Error al consultar empleados' });
  }
});

// POST: Crear nuevo empleado
app.post('/api/empleados', async (req, res) => {
  const { 
    nombre, 
    apellido_paterno, 
    apellido_materno, 
    puesto, 
    correo, 
    telefono, 
    horas_laborales, 
    rol, 
    foto_url 
  } = req.body;

  try {
    const resultado = await pool.query(
      `INSERT INTO empleados 
        (nombre, apellido_paterno, apellido_materno, puesto, correo, telefono, horas_laborales, rol, foto_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [nombre, apellido_paterno, apellido_materno || '', puesto, correo || '', telefono || '', horas_laborales, rol, foto_url || '']
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al crear empleado:', error.message);
    res.status(500).json({ mensaje: 'Error al guardar el empleado en la BD' });
  }
});

// PUT: Actualizar un empleado existente
app.put('/api/empleados/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    nombre, 
    apellido_paterno, 
    apellido_materno, 
    puesto, 
    correo, 
    telefono, 
    horas_laborales, 
    rol, 
    foto_url 
  } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE empleados SET 
        nombre = $1, 
        apellido_paterno = $2, 
        apellido_materno = $3, 
        puesto = $4, 
        correo = $5, 
        telefono = $6, 
        horas_laborales = $7, 
        rol = $8, 
        foto_url = $9 
       WHERE id_empleado = $10 
       RETURNING *`,
      [nombre, apellido_paterno, apellido_materno || '', puesto, correo || '', telefono || '', horas_laborales, rol, foto_url || '', id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al actualizar empleado:', error.message);
    res.status(500).json({ mensaje: 'Error al actualizar el empleado' });
  }
});

// DELETE: Eliminar un empleado
app.delete('/api/empleados/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query('DELETE FROM empleados WHERE id_empleado = $1 RETURNING *', [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error('Error al eliminar empleado:', error.message);
    res.status(500).json({ mensaje: 'Error al eliminar el empleado' });
  }
});


// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

setInterval(() => {}, 1000);