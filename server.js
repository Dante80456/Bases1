const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Verificar que DATABASE_URL esté definido
if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL no está definido en las variables de entorno.");
    process.exit(1);
}

// Configuración de la conexión a CockroachDB
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
});

// Verificar conexión a la base de datos
pool.connect()
    .then(() => console.log('✅ Conectado a CockroachDB'))
    .catch(err => {
        console.error('❌ Error conectando a la base de datos:', err);
        process.exit(1);
    });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Evita errores con favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Ruta principal para servir el index.html
app.get('/', (req, res) => {
    console.log("🟢 Ruta / llamada");
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta API principal
app.get('/api', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

// Endpoints CRUD para libros

// Crear un nuevo libro
app.post('/api/books', async (req, res) => {
    const { title, author, year } = req.body;
    
    if (!title || !author || !year) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const result = await pool.query(
            'INSERT INTO books (title, author, year) VALUES ($1, $2, $3) RETURNING *',
            [title, author, year]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al agregar el libro:', err);
        res.status(500).json({ error: 'Error al agregar el libro' });
    }
});

// Leer todos los libros
app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books');
        console.log("📚 Libros obtenidos:", result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error al obtener los libros:", err);
        res.status(500).json({ error: 'Error al obtener los libros' });
    }
});

// Actualizar un libro
app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, year } = req.body;

    if (!title || !author || !year) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, year = $3 WHERE id = $4 RETURNING *',
            [title, author, year, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error al actualizar el libro:', err);
        res.status(500).json({ error: 'Error al actualizar el libro' });
    }
});

// Eliminar un libro
app.delete('/api/books/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        res.json({ message: 'Libro eliminado correctamente', libro: result.rows[0] });
    } catch (err) {
        console.error('❌ Error al eliminar el libro:', err);
        res.status(500).json({ error: 'Error al eliminar el libro' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});

module.exports = app;
