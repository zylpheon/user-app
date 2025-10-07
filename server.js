import express from "express";
import pg from "pg";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Storage file upload
const storage = multer.diskStorage({
    destination: process.env.STORAGE_PATH,
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Buat tabel jika belum ada
(async () => {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      photo VARCHAR(255)
    );
  `);
})();

// Halaman utama (form input)
app.get("/", (req, res) => {
    res.sendFile(path.resolve("views/index.html"));
});

// Simpan data
app.post("/add", upload.single("photo"), async (req, res) => {
    const { name, email } = req.body;
    const photo = req.file ? req.file.filename : null;
    await pool.query("INSERT INTO users (name, email, photo) VALUES ($1, $2, $3)", [name, email, photo]);
    res.redirect("/users");
});

// Tampilkan data
app.get("/users", async (req, res) => {
    const result = await pool.query("SELECT * FROM users");
    const data = result.rows;
    let html = "<h2>Data Pengguna</h2><ul>";
    data.forEach(u => {
        html += `<li>${u.name} (${u.email}) <br><img src="/uploads/${u.photo}" width="100"></li>`;
    });
    html += "</ul><a href='/'>Kembali</a>";
    res.send(html);
});

app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
});
