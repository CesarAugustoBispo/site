const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const auth = require('../middleware/auth');
const Profile = require('../models/profile');
const Section = require('../models/section');
const Publication = require('../models/publication');
const Event = require('../models/event');

const router = express.Router();

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only image files allowed'), ok);
  }
});

// ── Auth ─────────────────────────────────────────────────────
router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

router.get('/api/auth/verify', auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ── Profile ──────────────────────────────────────────────────
router.get('/api/admin/profile', auth, (req, res) => {
  res.json(Profile.get());
});

router.put('/api/admin/profile', auth, (req, res) => {
  Profile.update(req.body);
  if (req.body.links) {
    Profile.updateLinks(req.body.links);
  }
  res.json(Profile.get());
});

router.post('/api/admin/profile/photo', auth, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const photoPath = `/uploads/${req.file.filename}`;
  Profile.updatePhoto(photoPath);
  res.json({ photo_path: photoPath });
});

// ── Sections ─────────────────────────────────────────────────
router.get('/api/admin/sections', auth, (req, res) => {
  res.json(Section.getAll());
});

router.put('/api/admin/sections/:slug/toggle', auth, (req, res) => {
  const section = Section.toggle(req.params.slug);
  if (!section) return res.status(404).json({ error: 'Section not found' });
  res.json(section);
});

router.put('/api/admin/sections/:slug/content', auth, (req, res) => {
  const { content } = req.body;
  const ok = Section.updateContent(req.params.slug, content || '');
  if (!ok) return res.status(404).json({ error: 'Section not found' });
  res.json(Section.getBySlug(req.params.slug));
});

// ── Publications ─────────────────────────────────────────────
router.get('/api/admin/publications', auth, (req, res) => {
  res.json(Publication.getAll(req.query));
});

router.get('/api/admin/publications/:id', auth, (req, res) => {
  const pub = Publication.getById(parseInt(req.params.id));
  if (!pub) return res.status(404).json({ error: 'Publication not found' });
  res.json(pub);
});

router.post('/api/admin/publications', auth, (req, res) => {
  const pub = Publication.create(req.body);
  res.status(201).json(pub);
});

router.put('/api/admin/publications/:id', auth, (req, res) => {
  const existing = Publication.getById(parseInt(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Publication not found' });
  const pub = Publication.update(parseInt(req.params.id), req.body);
  res.json(pub);
});

router.delete('/api/admin/publications/:id', auth, (req, res) => {
  const ok = Publication.delete(parseInt(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Publication not found' });
  res.json({ success: true });
});

// ── Events ──────────────────────────────────────────────────
router.get('/api/admin/events', auth, (req, res) => {
  res.json(Event.getAll(req.query));
});

router.get('/api/admin/events/:id', auth, (req, res) => {
  const event = Event.getById(parseInt(req.params.id));
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

router.post('/api/admin/events', auth, (req, res) => {
  const event = Event.create(req.body);
  res.status(201).json(event);
});

router.put('/api/admin/events/:id', auth, (req, res) => {
  const existing = Event.getById(parseInt(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  const event = Event.update(parseInt(req.params.id), req.body);
  res.json(event);
});

router.delete('/api/admin/events/:id', auth, (req, res) => {
  const ok = Event.delete(parseInt(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true });
});

router.put('/api/admin/events/:id/feature', auth, (req, res) => {
  const event = Event.toggleFeatured(parseInt(req.params.id));
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

module.exports = router;
