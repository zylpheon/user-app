# User Management Application

Aplikasi manajemen pengguna modern dengan Express.js, PostgreSQL, dan Multer untuk upload file. Aplikasi ini menampilkan form input data pengguna dengan fitur upload foto profil dan daftar pengguna yang tersimpan di database.

## 🚀 Fitur

- ✅ Form input data pengguna (Nama, Email, Foto Profil)
- ✅ Simpan data ke PostgreSQL
- ✅ Tampilkan daftar pengguna
- ✅ Upload foto profil dengan validasi
- ✅ Storage persisten untuk file upload
- ✅ UI modern dengan Tailwind CSS (glass morphism design)
- ✅ RESTful API endpoints

## 📋 Prasyarat

- Node.js >= 18.0.0
- PostgreSQL >= 12
- npm atau yarn

## 🛠️ Teknologi yang Digunakan

- **Backend**: Express.js 5.1.0
- **Database**: PostgreSQL 8.16.3
- **File Upload**: Multer 2.0.2
- **Environment Variables**: dotenv 17.2.3
- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/zylpheon/user-app.git
cd user-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database PostgreSQL

#### Instalasi PostgreSQL (Ubuntu/Debian)

```bash
# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Masuk ke PostgreSQL
sudo -u postgres psql
```

#### Konfigurasi Database

Jalankan perintah SQL berikut di PostgreSQL:

```sql
-- Create database
CREATE DATABASE userappdb;

-- Create user
CREATE USER tino WITH ENCRYPTED PASSWORD '123';

-- Grant privileges to User
GRANT ALL PRIVILEGES ON DATABASE userappdb TO tino;

-- Connect ke database
\c userappdb

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO tino;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tino;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tino;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tino;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tino;

-- Membuat tabel users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant akses tabel ke user
GRANT ALL PRIVILEGES ON TABLE users TO tino;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO tino;

-- Membuat Index untuk performa
CREATE INDEX idx_users_email ON users(email);
```

#### Konfigurasi Remote Access (Opsional)

Jika ingin mengakses database dari remote:

```bash
# Edit postgresql.conf
nano /etc/postgresql/[versi_postgresql]/main/postgresql.conf
# Ubah: listen_addresses = '*'

# Edit pg_hba.conf
nano /etc/postgresql/[versi_postgresql]/main/pg_hba.conf
# Tambahkan: host    all     all     0.0.0.0/0       md5

# Restart PostgreSQL
systemctl restart postgresql

# Atur firewall
ufw allow 5432/tcp
```

### 4. Konfigurasi Environment Variables

Buat file `.env` di root project:

```env
DATABASE_URL=postgresql://tino:123@10.20.11.122:5432/userappdb
DB_HOST=10.20.11.122
DB_PORT=5432
DB_NAME=userappdb
DB_USER=tino
DB_PASSWORD=123
PORT=3000
NODE_ENV=development
STORAGE_PATH=public/uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,image/gif,image/webp
MAX_FILES=1
```

**Catatan**: Sesuaikan nilai `DB_HOST`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` dengan konfigurasi database Anda.

### 5. Test Koneksi Database

```bash
node test-db.js
```

Output yang diharapkan:
```
Testing connection to: postgresql://tino:123@10.20.11.122:5432/userappdb
Connection successful!
Server time: [timestamp]
```

## 🚀 Menjalankan Aplikasi

### Mode Production

```bash
npm start
```

### Mode Development (dengan auto-reload)

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## 📁 Struktur Project

```
user-app/
├── public/
│   └── uploads/           # Folder untuk menyimpan file upload
├── views/
│   ├── index.html         # Form input pengguna
│   └── users.html         # Daftar pengguna
├── .env                   # Environment variables
├── server.js              # Main application file
├── test-db.js             # Database connection test
├── package.json           # Dependencies dan scripts
└── README.md              # Dokumentasi
```

## 🔌 API Endpoints

### 1. GET `/api/users`
Mendapatkan semua data pengguna

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "photo": "john-1234567890.jpg",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. GET `/api/users/:id`
Mendapatkan data pengguna berdasarkan ID

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "photo": "john-1234567890.jpg",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### 3. POST `/add`
Menambahkan pengguna baru dengan foto profil

**Form Data:**
- `name` (required): Nama pengguna
- `email` (required): Email pengguna
- `photo` (optional): File foto profil

**Response:** Redirect ke `/users`

### 4. PUT `/api/users/:id`
Mengupdate data pengguna

**Form Data:**
- `name` (optional): Nama baru
- `email` (optional): Email baru
- `photo` (optional): Foto profil baru

**Response:**
```json
{
  "id": 1,
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "photo": "john-9876543210.jpg",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### 5. DELETE `/api/users/:id`
Menghapus pengguna berdasarkan ID

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### 6. GET `/health`
Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 🌐 Halaman Web

### 1. Home Page (`/`)
Form input data pengguna dengan fitur:
- Input nama lengkap
- Input email
- Upload foto profil
- Tombol simpan dan lihat data

### 2. Users Page (`/users`)
Daftar semua pengguna dengan informasi:
- Foto profil (atau inisial jika tidak ada foto)
- Nama lengkap
- Email
- Tanggal pendaftaran
- Total jumlah pengguna
- Auto-refresh setiap 30 detik

## ⚙️ Konfigurasi

### File Upload

- **Max File Size**: 5MB (dapat diubah di `.env`)
- **Allowed Types**: JPEG, PNG, JPG, GIF, WebP
- **Storage Path**: `public/uploads/`
- **Naming Convention**: `[filename]-[timestamp]-[random].[ext]`

### Database Connection

- **Connection Timeout**: 5000ms
- **Idle Timeout**: 30000ms
- **Max Connections**: 10

## 🔒 Keamanan

- ✅ Validasi tipe file upload
- ✅ Batasan ukuran file
- ✅ SQL injection protection (parameterized queries)
- ✅ Error handling yang proper
- ✅ Environment variables untuk credentials

## 🐛 Troubleshooting

### Error: "Connection failed"
- Pastikan PostgreSQL sudah berjalan
- Periksa kredensial database di `.env`
- Cek firewall dan network connectivity

### Error: "File too large"
- File melebihi 5MB
- Ubah `MAX_FILE_SIZE` di `.env` jika diperlukan

### Error: "Invalid file type"
- File yang diupload bukan gambar
- Periksa `ALLOWED_FILE_TYPES` di `.env`

### Folder uploads tidak terbuat
- Aplikasi akan otomatis membuat folder saat startup
- Pastikan aplikasi memiliki write permission

## 📝 Catatan Pengembangan

### Database Schema

Tabel `users` memiliki struktur:
- `id`: Primary key (auto-increment)
- `name`: VARCHAR(100), NOT NULL
- `email`: VARCHAR(100), NOT NULL
- `photo`: VARCHAR(255), nullable
- `created_at`: TIMESTAMP, default CURRENT_TIMESTAMP

### Index Database

- `idx_users_email`: Index pada kolom email untuk query performa

## 📄 License

ISC

## 👤 Author

Your Name

---

**Dibuat dengan ❤️ untuk pembelajaran Database Management dan Web Development**
