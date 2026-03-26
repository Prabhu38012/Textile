import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import session from 'express-session';
import configurePassport from './src/config/passport.js';
import authRouter from './src/routes/auth.js';
import materialsRouter from './src/routes/materials.js';
import uploadRouter from './src/routes/upload.js';
import chatRouter from './src/routes/chat.js';
import paymentsRouter from './src/routes/payments.js';
import { sendWelcomeEmail, sendBillEmail } from './src/utils/mail.js';
import Material from './src/models/Material.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = CLIENT_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (no origin) and allowed origins
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    
    // Auto-allow any Vercel and Render production URLs
    if (/^https:\/\/.+\.vercel\.app$/.test(origin)) return callback(null, true);
    if (/^https:\/\/.+\.onrender\.com$/.test(origin)) return callback(null, true);

    // Allow any localhost (different ports) and 127.0.0.1 for local development
    try {
      const parsed = new URL(origin);
      const hostname = parsed.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return callback(null, true);
    } catch (e) {
      // ignore parse errors
    }
    console.warn(`Blocked CORS origin: ${origin}`);
    // Deny gracefully (false) instead of throwing an error to avoid crashing
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'textile_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Serve static files from uploads directory with logging
app.use('/uploads', (req, res, next) => {
  console.log('📸 Static file requested:', req.url);
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'textile-backend',
    message: 'Backend is running',
    health: '/api/health'
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});


app.use('/api/auth', authRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/chat', chatRouter);
app.use('/api/payments', paymentsRouter);

// test email endpoint (POST { email, name })
app.post('/api/test-email', async (req, res) => {
  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });
  try {
    const result = await sendWelcomeEmail(email, name);
    if (result && result.ok) return res.json({ ok: true, message: 'Email sent', info: result.info });
    return res.status(500).json({ ok: false, error: result && result.error ? result.error : 'Failed to send email' });
  } catch (err) {
    console.error('Test email send failed', err);
    res.status(500).json({ error: err && err.message ? err.message : 'Failed to send test email' });
  }
});

// send bill endpoint (POST { email, orderDetails, productId, quantityPurchased })
app.post('/api/send-bill', async (req, res) => {
  const { email, orderDetails, productId, quantityPurchased } = req.body || {};
  
  console.log('📧 Received send-bill request:', {
    email,
    productId,
    quantityPurchased,
    hasOrderDetails: !!orderDetails
  });
  
  if (!email) return res.status(400).json({ error: 'email is required' });
  if (!orderDetails) return res.status(400).json({ error: 'orderDetails is required' });
  
  try {
    // First send the bill email
    const result = await sendBillEmail(email, orderDetails);
    
    if (result && result.ok) {
      console.log('✅ Bill email sent successfully');
      
      // If email sent successfully and productId is provided, reduce quantity
      if (productId && quantityPurchased && quantityPurchased > 0) {
        console.log(`🔄 Attempting to reduce quantity for product: ${productId}, amount: ${quantityPurchased}`);
        
        try {
          const material = await Material.findById(productId);
          
          if (material) {
            console.log(`📦 Found material: ${material.title}, Current quantity: ${material.quantity}`);
            
            if (material.quantity >= quantityPurchased) {
              const oldQuantity = material.quantity;
              material.quantity -= quantityPurchased;
              await material.save();
              console.log(`✅ Reduced quantity for ${material.title}: ${oldQuantity} -> ${material.quantity} (-${quantityPurchased} meters)`);
            } else {
              console.warn(`⚠️ Insufficient quantity for ${material.title}. Available: ${material.quantity}, Requested: ${quantityPurchased}`);
            }
          } else {
            console.warn(`⚠️ Material not found with ID: ${productId}`);
          }
        } catch (quantityError) {
          console.error('❌ Error reducing quantity:', quantityError);
          // Don't fail the whole request if quantity update fails
        }
      } else {
        console.log('ℹ️ Skipping quantity reduction - missing productId or quantityPurchased');
      }
      
      return res.json({ ok: true, message: 'Bill email sent successfully and quantity updated' });
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: result && result.error ? result.error : 'Failed to send bill email' 
    });
  } catch (err) {
    console.error('Bill email send failed', err);
    res.status(500).json({ 
      error: err && err.message ? err.message : 'Failed to send bill email' 
    });
  }
});

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'textile' });
    console.log('MongoDB connected');
    const server = app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Most likely another backend instance is already running.`);
        console.error('Use one backend terminal only, or run: npm run start:clean');
        console.error(`PowerShell check: Get-NetTCPConnection -LocalPort ${PORT} | Where-Object { $_.State -eq 'Listen' } | Select-Object LocalAddress,LocalPort,State,OwningProcess`);
        console.error(`PowerShell stop: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT} | Where-Object { $_.State -eq 'Listen' } | Select-Object -First 1 -ExpandProperty OwningProcess) -Force`);
        process.exit(1);
      }
      console.error('Server listen error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
