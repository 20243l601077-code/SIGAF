const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000; // El mensajero escuchará en la estación 3000

// 1. Permitimos que Angular hable con nosotros y entendamos formato JSON (paquetes de texto)
app.use(cors());
app.use(express.json());

// 2. Le damos la llave maestra al mensajero para conectarse a PostgreSQL
const pool = new Pool({
  user: 'postgres',          // Tu usuario de Postgres
  host: 'localhost',         // Tu computadora
  database: 'sigaf_db',      // Cambia esto por el nombre de tu base de datos
  password: '1234567890', // ¡Escribe aquí tu contraseña real de Postgres!
  port: 5432,
});

// 3. ¡El primer camino! Cuando Angular pida "http://localhost:3000/api/productos"
app.get('/src/app/pages/inventario', async (req, res) => {
  try {
    // El mensajero abre el cofre y toma los productos
    const resultado = await pool.query('SELECT id_producto, descripcion, precio_unitario, stock_actual FROM producto');
    
    // Se los entrega a Angular envueltos en una cajita de regalo (JSON)
    res.json(resultado.rows);
  } catch (error) {
    console.error("¡Oh no, se cayó el juguete!", error);
    res.status(500).send("Error al sacar los juguetes del cofre");
  }
});

// 4. Encendemos la estación de radio del mensajero
app.listen(PORT, () => {
  console.log(`🎈 ¡El mensajero está listo y escuchando en http://localhost:3000!`);
});