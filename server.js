// server.js
import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import { normalizeEmail, isEmail } from 'validator';

// Carica variabili d'ambiente da .env
dotenv.config();

// Configurazione server Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // permette di leggere JSON dal body

// Porta dinamica (Render assegna process.env.PORT)
const PORT = process.env.PORT || 5000;

// Route POST per ricevere i dati del form
app.post('/send-email', async (req, res) => {
    try {
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

        // Validazione campi obbligatori
        if (!type || !name || !email || !phone || !address) {
            return res.status(400).json({
                success: false,
                error: 'Campi obbligatori mancanti'
            });
        }

        // Validazione tipo utente
        if (!['privato', 'azienda'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo utente non valido'
            });
        }

        // Sanitizzazione e validazione email
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || !isEmail(normalizedEmail, {
            require_tld: true,
            allow_ip_domain: false
        })) {
            return res.status(400).json({
                success: false,
                error: 'Email non valida'
            });
        }

        // Configura Nodemailer con SMTP Gmail
        const transporter = nodemailer.createTransport({
            host: "authsmtp.securemail.pro",
            port: 465,
            secure: true, // true per porta 465 con SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });

        // Corpo della mail
        const mailOptions = {
            from: process.env.EMAIL_USER,
            replyTo: normalizedEmail,
            to: process.env.EMAIL_RECEIVER,
            subject: `Richiesta rivenditore Sobrio30 - ${name}`,
            text: `
Nuova richiesta rivenditore Sobrio30

Tipo utente: ${type}
Nome: ${name}
Email: ${normalizedEmail}
Telefono: ${phone}
Indirizzo: ${address}
Nome attività: ${activityName || "-"}
Tipo attività: ${activityType || "-"}
Messaggio: ${message || "-"}

Data richiesta: ${new Date().toLocaleString('it-IT')}
            `,
            html: `
                <h2>Nuova richiesta rivenditore Sobrio30</h2>
                <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Tipo utente:</td>
                        <td style="padding: 8px;">${type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Nome:</td>
                        <td style="padding: 8px;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Email:</td>
                        <td style="padding: 8px;"><a href="mailto:${normalizedEmail}">${normalizedEmail}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Telefono:</td>
                        <td style="padding: 8px;"><a href="tel:${phone}">${phone}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Indirizzo:</td>
                        <td style="padding: 8px;">${address}</td>
                    </tr>
                    ${activityName ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Nome attività:</td>
                        <td style="padding: 8px;">${activityName}</td>
                    </tr>` : ''}
                    ${activityType ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Tipo attività:</td>
                        <td style="padding: 8px;">${activityType}</td>
                    </tr>` : ''}
                    ${message ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5; vertical-align: top;">Messaggio:</td>
                        <td style="padding: 8px;">${message}</td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Data richiesta:</td>
                        <td style="padding: 8px;">${new Date().toLocaleString('it-IT')}</td>
                    </tr>
                </table>
            `
        };

        // Verifica connessione prima di inviare
        await transporter.verify();

        // Invio email
        const info = await transporter.sendMail(mailOptions);

        console.log(`✓ Email inviata con successo: ${info.messageId}`);
        console.log(`  Da: ${name} <${normalizedEmail}>`);
        console.log(`  Tipo: ${type}`);

        res.json({
            success: true,
            message: 'Email inviata con successo',
            messageId: info.messageId
        });

    } catch (err) {
        console.error("✗ Errore invio email:", err.message);

        // Log più dettagliato per debugging
        if (err.code) console.error(`  Codice errore: ${err.code}`);
        if (err.command) console.error(`  Comando: ${err.command}`);

        res.status(500).json({
            success: false,
            error: 'Errore durante l\'invio dell\'email. Riprova più tardi.',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Gestione rotte non trovate
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint non trovato'
    });
});

// Gestione errori globale
app.use((err, req, res, next) => {
    console.error('Errore non gestito:', err);
    res.status(500).json({
        success: false,
        error: 'Errore interno del server'
    });
});

// Avvio server
app.listen(PORT, () => {
    console.log(`✓ Server Sobrio30 avviato correttamente`);
    console.log(`  Porta: ${PORT}`);
    console.log(`  Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Email configurata: ${process.env.EMAIL_USER ? '✓' : '✗'}`);
    console.log(`  Health check: http://localhost:${PORT}/health`);
});