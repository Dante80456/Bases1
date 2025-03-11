const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Crear un nuevo libro
app.post("/api/books", async (req, res) => {
  const { title, author, year } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO books (title, author, year) VALUES ($1, $2, $3) RETURNING *",
      [title, author, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al agregar el libro");
  }
});

// Leer todos los libros
app.get("/api/books", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM books");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener los libros");
  }
});

// Middleware de exportación para Vercel
module.exports = app;
