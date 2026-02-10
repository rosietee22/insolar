require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for PWA
}));

// Rate limiting - global: 200 requests per 15 minutes per IP (skip in development)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests', message: 'Please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});
app.use(globalLimiter);

// API rate limit: 60 requests per 15 minutes (skip in development)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // limit each IP to 60 API requests per windowMs
  message: { error: 'API rate limit exceeded', message: 'Too many forecast requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

// Compression middleware
app.use(compression());

// CORS middleware - restrict to own domains
const allowedOrigins = [
  'https://sunbird.today',
  'https://www.sunbird.today',
  'https://insolar.fly.dev',
  'http://localhost:3000', // development
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));

// JSON parsing
app.use(express.json());

// Service worker: inject cache version from content hash
const fs = require('fs');
const FRONTEND_DIR = path.join(__dirname, '../frontend');
const SW_TEMPLATE = fs.readFileSync(path.join(FRONTEND_DIR, 'service-worker.js'), 'utf-8');

// Build version hash from static asset content at startup
const STATIC_ASSETS = [
  'index.html', 'css/styles.css', 'js/main.js', 'js/api.js',
  'js/location.js', 'js/ui.js', 'js/theme.js', 'js/colour-picker.js', 'js/birds.js'
];
const assetHash = crypto.createHash('md5');
for (const asset of STATIC_ASSETS) {
  try {
    const content = fs.readFileSync(path.join(FRONTEND_DIR, asset));
    assetHash.update(content);
  } catch (e) { /* skip missing files */ }
}
const CACHE_VERSION = assetHash.digest('hex').slice(0, 8);
console.log(`Cache version: ${CACHE_VERSION}`);

app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.send(SW_TEMPLATE.replace('__CACHE_VERSION__', CACHE_VERSION));
});

// Set session cookie on page loads (before static so / gets it)
app.use((req, res, next) => {
  const secret = process.env.API_SECRET;
  if (secret && !req.path.startsWith('/api/')) {
    const sessionValue = crypto.createHmac('sha256', secret).update('sunbird-session').digest('hex');
    res.cookie('sb_session', sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
  next();
});

// Serve static frontend files with cache control
app.use(express.static(path.join(FRONTEND_DIR), {
  maxAge: '1d', // Cache icons/images for 1 day
  setHeaders: (res, filePath) => {
    // Never cache service worker, HTML, JS, CSS - always check for updates
    if (filePath.endsWith('service-worker.js') || 
        filePath.endsWith('.html') || 
        filePath.endsWith('.js') || 
        filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (with stricter rate limiting)
app.use('/api/forecast', apiLimiter, require('./routes/forecast'));
app.use('/api/birds', apiLimiter, require('./routes/birds'));
app.use('/api/bird-image', apiLimiter, require('./routes/bird-image'));
app.use('/api/location', require('./routes/location'));

// Catch-all: serve index.html for SPA routing (Express 5 compatible)
app.get('/:path(.*)', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Sunbird server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
