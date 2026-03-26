const db = require('../config/database');

const Section = {
  getAll() {
    return db.prepare('SELECT * FROM sections ORDER BY id').all();
  },

  getActive() {
    return db.prepare('SELECT * FROM sections WHERE is_active = 1 ORDER BY id').all();
  },

  getBySlug(slug) {
    return db.prepare('SELECT * FROM sections WHERE slug = ?').get(slug);
  },

  toggle(slug) {
    const section = db.prepare('SELECT * FROM sections WHERE slug = ?').get(slug);
    if (!section) return null;
    const newState = section.is_active ? 0 : 1;
    db.prepare('UPDATE sections SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?').run(newState, slug);
    return { ...section, is_active: newState };
  },

  updateContent(slug, content) {
    const result = db.prepare('UPDATE sections SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?').run(content, slug);
    return result.changes > 0;
  }
};

module.exports = Section;
