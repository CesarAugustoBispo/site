const db = require('../config/database');

const Event = {
  getAll({ search, year, role } = {}) {
    let sql = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
    if (year) { sql += " AND strftime('%Y', start_date) = ?"; params.push(String(year)); }
    if (role) { sql += ' AND role = ?'; params.push(role); }

    sql += ' ORDER BY start_date DESC, sort_order ASC, id DESC';
    return db.prepare(sql).all(...params);
  },

  getFeatured(limit = 5) {
    return db.prepare(
      `SELECT * FROM events WHERE is_featured = 1 AND start_date >= date('now') ORDER BY start_date ASC, sort_order ASC LIMIT ?`
    ).all(limit);
  },

  getUpcoming(limit = 5) {
    // First try future events, then fall back to most recent events
    let events = db.prepare(
      `SELECT * FROM events WHERE is_featured = 1 AND start_date >= date('now') ORDER BY start_date ASC, sort_order ASC LIMIT ?`
    ).all(limit);

    if (events.length === 0) {
      events = db.prepare(
        'SELECT * FROM events WHERE is_featured = 1 ORDER BY start_date DESC, sort_order ASC LIMIT ?'
      ).all(limit);
    }

    return events;
  },

  getById(id) {
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  },

  create(data) {
    const result = db.prepare(
      'INSERT INTO events (name, url, location, role, start_date, end_date, description, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      data.name,
      data.url || '',
      data.location || '',
      data.role || '',
      data.start_date,
      data.end_date || '',
      data.description || '',
      data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : 1,
      data.sort_order || 0
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    db.prepare(
      'UPDATE events SET name=?, url=?, location=?, role=?, start_date=?, end_date=?, description=?, is_featured=?, sort_order=? WHERE id=?'
    ).run(
      data.name,
      data.url || '',
      data.location || '',
      data.role || '',
      data.start_date,
      data.end_date || '',
      data.description || '',
      data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : 1,
      data.sort_order || 0,
      id
    );
    return this.getById(id);
  },

  delete(id) {
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);
    return result.changes > 0;
  },

  toggleFeatured(id) {
    const event = this.getById(id);
    if (!event) return null;
    db.prepare('UPDATE events SET is_featured = ? WHERE id = ?').run(event.is_featured ? 0 : 1, id);
    return this.getById(id);
  }
};

module.exports = Event;
