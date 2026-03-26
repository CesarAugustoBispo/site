const db = require('../config/database');

const Publication = {
  getAll({ year, status, search, limit, offset } = {}) {
    let sql = 'SELECT * FROM publications WHERE 1=1';
    const params = [];

    if (year) { sql += ' AND year = ?'; params.push(year); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }

    sql += ' ORDER BY year DESC, sort_order ASC, id DESC';

    if (limit) { sql += ' LIMIT ?'; params.push(limit); }
    if (offset) { sql += ' OFFSET ?'; params.push(offset); }

    const pubs = db.prepare(sql).all(...params);
    const authorStmt = db.prepare('SELECT * FROM publication_authors WHERE publication_id = ? ORDER BY sort_order');

    return pubs.map(pub => ({
      ...pub,
      authors: authorStmt.all(pub.id)
    }));
  },

  getRecent(limit = 5) {
    return this.getAll({ limit });
  },

  getById(id) {
    const pub = db.prepare('SELECT * FROM publications WHERE id = ?').get(id);
    if (!pub) return null;
    pub.authors = db.prepare('SELECT * FROM publication_authors WHERE publication_id = ? ORDER BY sort_order').all(id);
    return pub;
  },

  create(data) {
    const insertPub = db.prepare('INSERT INTO publications (title, url, year, status, venue, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    const insertAuthor = db.prepare('INSERT INTO publication_authors (publication_id, author_name, is_self, sort_order) VALUES (?, ?, ?, ?)');

    const transaction = db.transaction((d) => {
      const result = insertPub.run(d.title, d.url || '', d.year, d.status || 'Published', d.venue || '', d.sort_order || 0);
      const pubId = result.lastInsertRowid;

      if (d.authors && d.authors.length) {
        d.authors.forEach((a, i) => {
          insertAuthor.run(pubId, a.author_name, a.is_self ? 1 : 0, i + 1);
        });
      }

      return pubId;
    });

    const id = transaction(data);
    return this.getById(id);
  },

  update(id, data) {
    const updatePub = db.prepare('UPDATE publications SET title=?, url=?, year=?, status=?, venue=?, sort_order=? WHERE id=?');
    const delAuthors = db.prepare('DELETE FROM publication_authors WHERE publication_id = ?');
    const insertAuthor = db.prepare('INSERT INTO publication_authors (publication_id, author_name, is_self, sort_order) VALUES (?, ?, ?, ?)');

    const transaction = db.transaction((d) => {
      updatePub.run(d.title, d.url || '', d.year, d.status || 'Published', d.venue || '', d.sort_order || 0, id);
      delAuthors.run(id);

      if (d.authors && d.authors.length) {
        d.authors.forEach((a, i) => {
          insertAuthor.run(id, a.author_name, a.is_self ? 1 : 0, i + 1);
        });
      }
    });

    transaction(data);
    return this.getById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM publication_authors WHERE publication_id = ?').run(id);
    const result = db.prepare('DELETE FROM publications WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = Publication;
