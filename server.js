// server.js
import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

// Carica variabili d'ambiente da .env
dotenv.config();

// Configurazione server Express
const app = express();
app.use(cors());
app.use(express.json()); // permette di leggere JSON dal body

// Porta dinamica (Render assegna process.env.PORT)
const PORT = process.env.PORT || 5000;

// Route POST per ricevere i dati del form
app.post('/send-email', async (req, res) => {
    const {
        type,
        name,
        email,
        phone,
        address,
        message,
        activityName,
        activityType
    } = req.body;

    // Configura Nodemailer (SMTP Gmail, ma puoi usare altri provider)
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true solo se usi 465
        auth: {
            user: process.env.EMAIL_USER,     // sostituisci con la tua email
            pass: process.env.EMAIL_PASS      // password app Gmail o SMTP
        }
    });

    // Corpo della mail
    const mailOptions = {
        from: email,
        to: process.env.EMAIL_RECEIVER, // email dove vuoi ricevere i messaggi
        subject: "Richiesta rivenditore Sobrio30",
        text: `
Nuova richiesta rivenditore Sobrio30

Tipo utente: ${type}
Nome: ${name}
Email: ${email}
Telefono: ${phone}
Indirizzo: ${address}
Nome attività: ${activityName || "-"}
Tipo attività: ${activityType || "-"}
Messaggio: ${message}
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        console.error("Errore invio email:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Avvio server
app.listen(PORT, () => {
    console.log(`Server avviato su port ${PORT}`);
});
