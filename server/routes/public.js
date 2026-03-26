const express = require('express');
const { marked } = require('marked');
const Profile = require('../models/profile');
const Section = require('../models/section');
const Publication = require('../models/publication');
const Event = require('../models/event');

const router = express.Router();

// Helper: get common template data
function commonData(req) {
  return {
    profile: Profile.get(),
    sections: Section.getActive(),
    currentPath: req.path,
  };
}

// Home page
router.get('/', (req, res) => {
  const data = commonData(req);
  const pubSection = Section.getBySlug('publications');
  const publications = pubSection && pubSection.is_active ? Publication.getRecent(5) : [];
  const eventsSection = Section.getBySlug('scientific-events');
  const upcomingEvents = eventsSection && eventsSection.is_active ? Event.getUpcoming(5) : [];
  res.render('pages/home', { ...data, publications, upcomingEvents, title: data.profile ? data.profile.name : 'Academic Page' });
});

// Section pages
router.get('/section/:slug', (req, res, next) => {
  const section = Section.getBySlug(req.params.slug);
  if (!section || !section.is_active) {
    const err = new Error('Page not found');
    err.status = 404;
    return next(err);
  }

  const data = commonData(req);

  // Publications page gets special treatment
  if (section.slug === 'publications') {
    const { year, status, search } = req.query;
    const publications = Publication.getAll({ year, status, search });
    const years = [...new Set(publications.map(p => p.year))].sort((a, b) => b - a);
    return res.render('pages/publications', {
      ...data,
      section,
      publications,
      years,
      filters: { year, status, search },
      title: section.name,
    });
  }

  // Scientific Events page gets special treatment
  if (section.slug === 'scientific-events') {
    const { year, role, search } = req.query;
    const events = Event.getAll({ year, role, search });
    const years = [...new Set(events.map(e => new Date(e.start_date + 'T00:00:00').getFullYear()))].sort((a, b) => b - a);
    return res.render('pages/events', {
      ...data,
      section,
      events,
      years,
      filters: { year, role, search },
      title: section.name,
    });
  }

  // Other sections render Markdown content
  const htmlContent = marked(section.content || '');
  res.render('pages/section', { ...data, section, htmlContent, title: section.name });
});

// ── API Routes ──────────────────────────────────────────────
router.get('/api/profile', (req, res) => {
  res.json(Profile.get());
});

router.get('/api/sections', (req, res) => {
  res.json(Section.getAll());
});

router.get('/api/publications', (req, res) => {
  const { year, status, search, limit, offset } = req.query;
  res.json(Publication.getAll({
    year: year ? parseInt(year) : undefined,
    status,
    search,
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
  }));
});

router.get('/api/events', (req, res) => {
  const { search, year } = req.query;
  res.json(Event.getAll({ search, year: year ? parseInt(year) : undefined }));
});

router.get('/api/events/featured', (req, res) => {
  res.json(Event.getUpcoming(5));
});

router.get('/api/sections/:slug', (req, res) => {
  const section = Section.getBySlug(req.params.slug);
  if (!section) return res.status(404).json({ error: 'Section not found' });
  res.json(section);
});

module.exports = router;
