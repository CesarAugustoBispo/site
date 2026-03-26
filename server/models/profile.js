const db = require('../config/database');

const Profile = {
  get() {
    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    if (!profile) return null;
    profile.links = db.prepare('SELECT * FROM academic_links WHERE profile_id = 1 ORDER BY sort_order').all();
    return profile;
  },

  update(data) {
    db.prepare(`
      UPDATE profile SET
        name = ?, title = ?, department = ?, institute = ?, university = ?,
        country = ?, email = ?, research_interests = ?, group_name = ?,
        group_url = ?, footer_address = ?
      WHERE id = 1
    `).run(
      data.name, data.title, data.department, data.institute, data.university,
      data.country, data.email, data.research_interests, data.group_name,
      data.group_url, data.footer_address
    );
  },

  updatePhoto(photoPath) {
    db.prepare('UPDATE profile SET photo_path = ? WHERE id = 1').run(photoPath);
  },

  getLinks() {
    return db.prepare('SELECT * FROM academic_links WHERE profile_id = 1 ORDER BY sort_order').all();
  },

  updateLinks(links) {
    const del = db.prepare('DELETE FROM academic_links WHERE profile_id = 1');
    const ins = db.prepare('INSERT INTO academic_links (profile_id, label, url, icon, sort_order) VALUES (1, ?, ?, ?, ?)');

    const transaction = db.transaction((items) => {
      del.run();
      items.forEach((link, i) => {
        ins.run(link.label || '', link.url || '', link.icon || '', i + 1);
      });
    });

    transaction(links);
  }
};

module.exports = Profile;
