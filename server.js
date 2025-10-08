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
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10
});
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});
pool.on('error', (err) => {
    console.error('Database error:', err.message);
});
const uploadPath = path.join(__dirname, process.env.STORAGE_PATH || "public/uploads");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Created upload directory: ${uploadPath}`);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/gif',
        'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
    }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadPath));
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                photo VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `);
        console.log("Database tables ready");
    } catch (err) {
        console.error("Database initialization error:", err.message);
        process.exit(1);
    }
})();
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"));
});
app.get("/users", (req, res) => {
    res.sendFile(path.join(__dirname, "views/users.html"));
});
app.get("/api/users", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM users ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Query error:", err.message);
        res.status(500).json({
            error: "Database error",
            message: err.message
        });
    }
});
app.get("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Query error:", err.message);
        res.status(500).json({
            error: "Database error",
            message: err.message
        });
    }
});
app.post("/add", upload.single("photo"), async (req, res) => {
    const { name, email } = req.body;
    const photo = req.file ? req.file.filename : null;
    if (!name || !email) {
        return res.status(400).send("Name and email are required");
    }

    try {
        const result = await pool.query(
            "INSERT INTO users (name, email, photo) VALUES ($1, $2, $3) RETURNING *",
            [name, email, photo]
        );
        console.log(`New user added: ${name} (${email})`);
        res.redirect("/users");
    } catch (err) {
        console.error("Insert error:", err.message);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).send("Database insert error: " + err.message);
    }
});
app.put("/api/users/:id", upload.single("photo"), async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const photo = req.file ? req.file.filename : null;
    try {
        if (photo) {
            const oldData = await pool.query(
                "SELECT photo FROM users WHERE id = $1",
                [id]
            );
            if (oldData.rows[0]?.photo) {
                const oldPhotoPath = path.join(uploadPath, oldData.rows[0].photo);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
        }
        const query = photo
            ? "UPDATE users SET name = $1, email = $2, photo = $3 WHERE id = $4 RETURNING *"
            : "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *";
        const params = photo
            ? [name, email, photo, id]
            : [name, email, id];
        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Update error:", err.message);
        res.status(500).json({
            error: "Database update error",
            message: err.message
        });
    }
});
app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const userData = await pool.query(
            "SELECT photo FROM users WHERE id = $1",
            [id]
        );
        if (userData.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        if (userData.rows[0].photo) {
            const photoPath = path.join(uploadPath, userData.rows[0].photo);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err.message);
        res.status(500).json({
            error: "Database delete error",
            message: err.message
        });
    }
});
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send("File too large. Maximum size is 5MB");
        }
        return res.status(400).send("File upload error: " + err.message);
    }
    res.status(500).send("Internal server error");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  Server is running!                        ║
║  URL: http://localhost:${PORT}                ║
║  Environment: ${process.env.NODE_ENV || 'development'}                  ║
║  Upload Path: ${uploadPath}
║  Ready to accept requests                  ║
╚════════════════════════════════════════════╝
    `);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});