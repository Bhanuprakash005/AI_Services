const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - allow all origins so Vercel frontend can call this API
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set — submissions will not be stored.');
    return null;
  }

  const client = new MongoClient(uri);
  await client.connect();

  const dbName = process.env.MONGODB_DB; // optional override
  const db = dbName ? client.db(dbName) : client.db();
  const collection = db.collection('contact_submissions');

  console.log('MongoDB connected');
  return { client, collection };
}

const mongoPromise = connectMongo().catch((err) => {
  console.error('MongoDB connection error:', err);
  return null;
});

async function createTransporter() {
  const hasSmtpConfig =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    transporter.verify((error) => {
      if (error) {
        console.error('SMTP configuration error:', error);
      } else {
        console.log('SMTP server is ready to send messages');
      }
    });

    return {
      transporter,
      isTestAccount: false,
      defaultFrom: process.env.SMTP_FROM || process.env.SMTP_USER,
      defaultTo: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
    };
  }

  // Dev-friendly fallback: use Ethereal test SMTP if no credentials are provided.
  // This keeps production behavior intact (set env vars to use real SMTP).
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log('Using Ethereal test SMTP (set SMTP_* env vars for real email).');
  console.log(`Ethereal inbox: ${testAccount.user}`);

  return {
    transporter,
    isTestAccount: true,
    defaultFrom: testAccount.user,
    defaultTo: testAccount.user,
  };
}

const mailerPromise = createTransporter();

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required (name, email, message)',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
    }

    // Prepare email content
    const mailer = await mailerPromise;
    const mongo = await mongoPromise;

    const from =
      process.env.SMTP_FROM || process.env.SMTP_USER || mailer.defaultFrom;
    const businessEmail =
      process.env.CONTACT_EMAIL ||
      process.env.BUSINESS_EMAIL ||
      process.env.SMTP_USER ||
      mailer.defaultTo;

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessageHtml = escapeHtml(message).replace(/\n/g, '<br>');

    // Store submission first (so we never lose it)
    let stored = false;
    let submissionId = null;
    if (mongo) {
      try {
        const submissionDoc = {
          name,
          email,
          message,
          createdAt: new Date(),
          source: {
            ip: req.ip,
            userAgent: req.get('user-agent') || null,
          },
          emailStatus: {
            adminSent: false,
            userConfirmationSent: false,
          },
        };

        const insertResult = await mongo.collection.insertOne(submissionDoc);
        stored = true;
        submissionId = insertResult.insertedId;
      } catch (dbErr) {
        console.error('Failed to store submission in MongoDB:', dbErr);
      }
    }

    // 1) Admin notification -> business inbox
    const adminMail = {
      from,
      to: businessEmail,
      replyTo: email,
      subject: `New Contact Form Submission — ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessageHtml}</p>
      `,
      text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`,
    };

    const adminInfo = await mailer.transporter.sendMail(adminMail);
    if (mongo && submissionId) {
      await mongo.collection.updateOne(
        { _id: submissionId },
        {
          $set: {
            'emailStatus.adminSent': true,
            'emailStatus.adminMessageId': adminInfo.messageId || null,
            updatedAt: new Date(),
          },
        }
      );
    }
    if (mailer.isTestAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(adminInfo);
      if (previewUrl) console.log('Admin email preview URL:', previewUrl);
    }

    // 2) Auto-reply -> the user (sent *from* your business mailbox)
    const firstName = String(name).trim().split(/\s+/)[0] || String(name).trim();
    const userMail = {
      from,
      to: email,
      subject: `Thanks for reaching out, ${firstName}!`,
      html: `
        <p>Hi ${safeName},</p>
        <p>Thanks for connecting. We’ve received your message and will get back to you shortly.</p>
        <p><strong>Your message:</strong></p>
        <p>${safeMessageHtml}</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="color:#6b7280;font-size:14px;">
          This is an automated confirmation from AI Consulting Services.
        </p>
      `,
      text:
        `Hi ${name},\n\n` +
        `Thanks for connecting. We’ve received your message and will get back to you shortly.\n\n` +
        `Your message:\n${message}\n\n` +
        `— AI Consulting Services\n`,
    };

    let confirmationEmailSent = true;
    try {
      const userInfo = await mailer.transporter.sendMail(userMail);
      if (mongo && submissionId) {
        await mongo.collection.updateOne(
          { _id: submissionId },
          {
            $set: {
              'emailStatus.userConfirmationSent': true,
              'emailStatus.userConfirmationMessageId': userInfo.messageId || null,
              updatedAt: new Date(),
            },
          }
        );
      }
      if (mailer.isTestAccount) {
        const previewUrl = nodemailer.getTestMessageUrl(userInfo);
        if (previewUrl) console.log('User auto-reply preview URL:', previewUrl);
      }
    } catch (e) {
      confirmationEmailSent = false;
      console.error('Failed to send user confirmation email:', e);
      if (mongo && submissionId) {
        await mongo.collection.updateOne(
          { _id: submissionId },
          {
            $set: {
              'emailStatus.userConfirmationSent': false,
              'emailStatus.userConfirmationError': String(e?.message || e),
              updatedAt: new Date(),
            },
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      stored,
      submissionId: submissionId ? String(submissionId) : null,
      confirmationEmailSent,
      message:
        confirmationEmailSent
          ? 'Thanks! Your message was sent. Please check your inbox for a confirmation email.'
          : 'Thanks! Your message was sent. (We could not send a confirmation email right now.)',
    });
  } catch (error) {
    console.error('Error sending email:', error);

    const isDev = process.env.NODE_ENV !== 'production';
    const isAuthError =
      error?.code === 'EAUTH' || error?.responseCode === 535 || error?.command === 'AUTH';

    res.status(500).json({
      success: false,
      error: isDev && isAuthError
        ? 'Email login failed. For Gmail you must use an App Password (not your normal password). Update SMTP_USER/SMTP_PASS in backend/.env and restart the server.'
        : 'Failed to send message. Please try again later.',
    });
  }
});

// GET /api/contact - friendly response when visited in browser (form uses POST)
app.get('/api/contact', (req, res) => {
  res.status(200).json({
    message: 'Contact API is running. Use POST with { name, email, message } to submit the form.',
    method: 'POST',
    endpoint: '/api/contact',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
