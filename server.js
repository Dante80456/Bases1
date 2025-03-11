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

// ✅ Función para insertar un libro SIN duplicados
async function insertUniqueBook(title, author, year) {
    try {
        // 🔍 Verificar si el libro ya existe
        const checkBook = await pool.query(
            'SELECT COUNT(*) AS count FROM books WHERE title = $1 AND author = $2',
            [title, author]
        );

        if (parseInt(checkBook.rows[0].count) > 0) {
            console.log('❌ El libro ya existe en la base de datos.');
            return { success: false, message: 'El libro ya existe' };
        }

        // ✅ Insertar el libro si no existe
        const result = await pool.query(
            'INSERT INTO books (title, author, year, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [title, author, year]
        );

        console.log('✅ Libro insertado correctamente.');
        return { success: true, message: 'Libro agregado exitosamente', book: result.rows[0] };
    } catch (err) {
        console.error('❌ Error al insertar libro:', err);
        return { success: false, message: 'Error al insertar libro' };
    }
}

// 🚀 Endpoint para crear un nuevo libro SIN duplicados
app.post('/api/books', async (req, res) => {
    const { title, author, year } = req.body;

    const result = await insertUniqueBook(title, author, year);

    if (!result.success) {
        return res.status(400).json(result);
    }

    res.status(201).json(result.book);
});

// 📚 Endpoint para obtener todos los libros
app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los libros');
    }
});

// ✏ Endpoint para actualizar un libro por ID
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

// 🗑 Endpoint para eliminar un libro por ID
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

// 🚀 Iniciar el servidor
app.listen(port, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});

module.exports = app;
