// backend/server.js
const express = require('express');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const { JSDOM } = require('jsdom');
require('svg2pdf.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

// Registration endpoint
app.post('/register', async (req, res) => {
    const { email, name, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await client.query(
            'INSERT INTO users(email, name, password) VALUES($1, $2, $3) RETURNING *',
            [email, name, hashedPassword]
        );
        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                res.status(200).json({ message: 'Login successful', user });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Certificate generation endpoint
app.post('/generate-certificate', async (req, res) => {
    const { email, instructorName } = req.body;  // Include email and instructor name from frontend

    try {
        const result = await client.query('SELECT name FROM users WHERE email = $1', [email]);
        const userName = result.rows[0].name;

        const svgPath = path.join(__dirname, 'certificate.svg');
        fs.readFile(svgPath, 'utf-8', async (err, svgContent) => {
            if (err) {
                console.error("Error reading SVG file:", err);
                return res.status(500).send("Template file not found");
            }

            const personalizedSvg = svgContent
                .replace('{{USER_NAME}}', userName)
                .replace('{{INSTRUCTOR_NAME}}', instructorName);

            const { window } = new JSDOM();
            window.SVGtoPDF = require('svg2pdf.js');
            
            const doc = new jsPDF();
            try {
                await doc.svg(personalizedSvg, { x: 0, y: 0, width: 210, height: 297 });
                const pdfData = doc.output('arraybuffer');
                
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');
                res.send(Buffer.from(pdfData));
            } catch (error) {
                console.error("Error generating certificate PDF:", error);
                res.status(500).send("Error generating certificate");
            }
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Error generating certificate");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
