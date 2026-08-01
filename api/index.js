const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Configuracion de conexion a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sigaf_bd',
  password: 'Postgres',
  port: 5432,
});

// Prevencion de cierres inesperados por errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err.message);
});

// Endpoint de Login con validaciones y restricciones de seguridad
app.post('/api/login', async (req, res) => {
  let { usuario, password } = req.body;

  // Restriccion 1: Validar que los campos obligatorios no vengan vacios
  if (!usuario || !password) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El correo y la contraseña son obligatorios'
    });
  }

  // Eliminar espacios en blanco accidentales en el correo
  usuario = usuario.trim();

  // Restriccion 2: Validar la estructura del correo electronico
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexCorreo.test(usuario)) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El formato del correo electrónico no es válido'
    });
  }

  // Restriccion 3: Validar longitud minima de contraseña
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

    // Restriccion 4: Verificar credenciales en base de datos
    if (resultado.rows.length === 0) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const usuarioEncontrado = resultado.rows[0];

    // Restriccion 5: Denegar acceso si el usuario esta inactivo
    if (!usuarioEncontrado.activo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Tu cuenta esta desactivada. Contacta al administrador.'
      });
    }

    // Respuesta exitosa tras pasar todas las restricciones
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

setInterval(() => {}, 1000);