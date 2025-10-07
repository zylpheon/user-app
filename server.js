import express from "express";
import pg from "pg";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();
const { Pool } = pg;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi koneksi PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Buat folder upload jika belum ada
const uploadPath = path.join(__dirname, process.env.STORAGE_PATH || "public/uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// Konfigurasi multer
const storage = multer.diskStorage({
    destination: uploadPath,
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadPath));
app.use(express.static("public"));

// Buat tabel jika belum ada
(async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        photo VARCHAR(255)
      );
    `);
        console.log("Table ready.");
    } catch (err) {
        console.error("DB init error:", err);
    }
})();

// Halaman utama
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

// Halaman users
app.get("/users", (req, res) => {
    res.sendFile(path.join(__dirname, "views/users.html"));
});

// API tampil data JSON
app.get("/api/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).send("Database error");
    }
});

// Simpan data pengguna
app.post("/add", upload.single("photo"), async (req, res) => {
    const { name, email } = req.body;
    const photo = req.file ? req.file.filename : null;

    try {
        await pool.query(
            "INSERT INTO users (name, email, photo) VALUES ($1, $2, $3)",
            [name, email, photo]
        );
        res.redirect("/users");
    } catch (err) {
        console.error("Insert error:", err);
        res.status(500).send("Database insert error");
    }
});

// Jalankan server (Vercel tidak pakai PORT environment)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
