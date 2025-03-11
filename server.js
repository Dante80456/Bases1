const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Configura la conexión a CockroachDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  } // Usa una variable de entorno en lugar de una conexión directa
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.get('/favicon.ico', (req, res) => res.status(204).end());


// Crear un nuevo libro
app.post('/api/books', async (req, res) => {
  const { title, author, year } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO books (title, author, year) VALUES ($1, $2, $3) RETURNING *', 
      [title, author, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar el libro');
  }
});

// Leer todos los libros
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los libros');
  }
});

// Actualizar un libro
app.put('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, year } = req.body;
  try {
    const result = await pool.query(
      'UPDATE books SET title = $1, author = $2, year = $3 WHERE id = $4 RETURNING *', 
      [title, author, year, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Libro no encontrado');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el libro');
  }
});

// Eliminar un libro
app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Libro no encontrado');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar el libro');
  }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.send('Servidor funcionando');
});

// Ruta API principal
app.get('/api', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

// Iniciar el servidor (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);
    });
}

module.exports = app;
