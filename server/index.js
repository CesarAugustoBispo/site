require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

// Auto-seed on first run (creates DB + default data if missing)
const dbPath = path.join(__dirname, '..', 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  console.log('First run detected — seeding database...');
  require('./seed');
}

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple cookie parser (read token from cookies)
app.use((req, _res, next) => {
  req.cookies = {};
  const header = req.headers.cookie;
  if (header) {
    header.split(';').forEach(c => {
      const [k, ...v] = c.split('=');
      req.cookies[k.trim()] = v.join('=').trim();
    });
  }
  next();
});

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Admin SPA - serve before API routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Routes
app.use('/', publicRoutes);
app.use('/', adminRoutes);

// 404 fallback
app.use((req, res, next) => {
  const err = new Error('Page not found');
  err.status = 404;
  next(err);
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n  Academic Site running at:`);
  console.log(`  → Public:  http://localhost:${PORT}`);
  console.log(`  → Admin:   http://localhost:${PORT}/admin`);
  console.log(`  → Login:   admin@admin.com / admin123\n`);
});
