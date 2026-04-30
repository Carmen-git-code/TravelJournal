const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// =======================================================================
// DATABASE CONNECTION POOL
// =======================================================================
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,         // Your RDS Endpoint goes here!
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD, // The password from Terraform
    database: process.env.DB_NAME || 'travel_journal_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// =======================================================================
// AUTOMATIC SCHEMA INITIALIZATION (DevOps Automation)
// =======================================================================
async function initializeDatabase() {
    try {
        console.log("Attempting to connect to RDS and initialize schema...");
        const connection = await dbPool.getConnection();
        
        // Automatically create the entries table if it doesn't exist
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS journal_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                startDate DATE,
                endDate DATE,
                note TEXT,
                photoUrl VARCHAR(1000),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Database schema is ready!");
        connection.release();
    } catch (error) {
        console.error("❌ Failed to initialize database:", error.message);
    }
}

// =======================================================================
// API ROUTES
// =======================================================================

// 1. HEALTH CHECK (Crucial for the AWS Application Load Balancer)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Healthy', message: 'EC2 App Tier is connected and running.' });
});

// 2. GET ALL ENTRIES
app.get('/api/entries', async (req, res) => {
    try {
        const [rows] = await dbPool.execute('SELECT * FROM journal_entries ORDER BY startDate DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to retrieve entries.' });
    }
});

// 3. CREATE A NEW ENTRY
app.post('/api/entries', async (req, res) => {
    const { title, location, startDate, endDate, note, photoUrl } = req.body;
    try {
        const [result] = await dbPool.execute(
            'INSERT INTO journal_entries (title, location, startDate, endDate, note, photoUrl) VALUES (?, ?, ?, ?, ?, ?)',
            [title, location, startDate, endDate, note, photoUrl]
        );
        res.status(201).json({ message: 'Entry saved!', id: result.insertId });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to save entry.' });
    }
});

// 4. DELETE AN ENTRY
app.delete('/api/entries/:id', async (req, res) => {
    try {
        await dbPool.execute('DELETE FROM journal_entries WHERE id = ?', [req.params.id]);
        res.status(200).json({ message: 'Entry deleted successfully.' });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to delete entry.' });
    }
});

// =======================================================================
// START THE SERVER
// =======================================================================
app.listen(PORT, async () => {
    console.log(`🚀 API running on port ${PORT}`);
    await initializeDatabase();
});
