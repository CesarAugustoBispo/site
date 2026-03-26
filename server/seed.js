require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('./config/database');

console.log('Seeding database...');

// 1. Create admin user
const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@admin.com');
if (!existingUser) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run('admin@admin.com', hash);
  console.log('  ✓ Admin user created (admin@admin.com / admin123)');
} else {
  console.log('  - Admin user already exists');
}

// 2. Create profile
const existingProfile = db.prepare('SELECT id FROM profile WHERE id = 1').get();
if (!existingProfile) {
  db.prepare(`
    INSERT INTO profile (id, name, title, department, institute, university, country, email, research_interests, group_name, group_url, photo_path, footer_address)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Nome Sobrenome',
    'Professor Associado',
    'Departamento de Ciência da Computação',
    'Instituto de Matemática e Estatística',
    'Universidade de São Paulo',
    'Brasil',
    'nome@ime.usp.br',
    'Otimização Combinatória, Teoria dos Grafos, Algoritmos de Aproximação, Complexidade Computacional, Programação Inteira',
    'Grupo de Otimização e Algoritmos (GOAL-USP)',
    '#',
    '',
    'Departamento de Ciência da Computação\nInstituto de Matemática e Estatística\nUniversidade de São Paulo\nRua do Matão, 1010 — Sala 000\nSão Paulo, SP — 05508-090, Brasil'
  );
  console.log('  ✓ Profile created');
} else {
  console.log('  - Profile already exists');
}

// 3. Create academic links
const existingLinks = db.prepare('SELECT COUNT(*) as count FROM academic_links').get();
if (existingLinks.count === 0) {
  const insertLink = db.prepare('INSERT INTO academic_links (profile_id, label, url, icon, sort_order) VALUES (1, ?, ?, ?, ?)');
  insertLink.run('ArXiv', '#', 'arxiv', 1);
  insertLink.run('ORCID', '#', 'orcid', 2);
  insertLink.run('Google Scholar', '#', 'scholar', 3);
  insertLink.run('Lattes', '#', 'lattes', 4);
  console.log('  ✓ Academic links created');
} else {
  console.log('  - Academic links already exist');
}

// 4. Create sections
const existingSections = db.prepare('SELECT COUNT(*) as count FROM sections').get();
if (existingSections.count === 0) {
  const insertSection = db.prepare('INSERT INTO sections (slug, name, is_active, content) VALUES (?, ?, 1, ?)');
  insertSection.run('publications', 'Publications', '');
  insertSection.run('research-projects', 'Research Projects', '## Current Projects\n\n### FAPESP 2023–2026: Algoritmos Online com Predições\nInvestigação do paradigma de algoritmos online auxiliados por predições de aprendizado de máquina.\n\n### CNPq Universal 2022–2025: Otimização em Redes\nEstudo de problemas de otimização em redes com ênfase em conectividade e fluxos.');
  insertSection.run('students', 'Students', '## Current Students\n\n**PhD**\n- Ana Paula Carvalho — *Algoritmos online com predições em problemas de escalonamento*\n- Bruno Marques Lopes — *Complexidade parametrizada de problemas de empacotamento em grafos*\n\n**MSc**\n- Camila Rodrigues Neto — *Algoritmos de aproximação para o TSP métrico*\n\n## Former Students\n\n- Felipe Augusto Rocha (PhD, 2023)\n- Gabriela Monteiro Cruz (MSc, 2022)');
  insertSection.run('teaching', 'Teaching', '## 2025.I\n\n| Course | Level | Materials |\n|--------|-------|-----------|\n| MAC0325 — Otimização Combinatória | Graduate | [Moodle](#) |\n| MAC0414 — Autômatos, Computabilidade e Complexidade | Undergraduate | [Moodle](#) |\n\n## 2024.II\n\n| Course | Level | Materials |\n|--------|-------|-----------|\n| MAC5781 — Tópicos em Algoritmos | Graduate | [Slides](#) |');
  insertSection.run('scientific-events', 'Scientific Events', '## 2025\n\n- **LATIN 2025** — Program Committee Member (Montevidéu, Uruguai)\n- **SODA 2025** — Speaker (Nova Orleans, EUA)\n\n## 2024\n\n- **FOCS 2024** — Attendee (Chicago, EUA)\n- **ICALP 2024** — Program Committee Member (Tallinn, Estônia)');
  insertSection.run('books-and-notes', 'Books and Notes', '## Lecture Notes\n\n- **Notas de Aula: Otimização Combinatória** (2024, 210 páginas) — [Download PDF](#)\n- **Notas de Aula: Análise de Algoritmos** (2023, 145 páginas) — [Download PDF](#)\n- **Introdução à Teoria dos Grafos** (2022, 178 páginas) — [Download PDF](#)');
  console.log('  ✓ Sections created');
} else {
  console.log('  - Sections already exist');
}

// 5. Create sample publications
const existingPubs = db.prepare('SELECT COUNT(*) as count FROM publications').get();
if (existingPubs.count === 0) {
  const insertPub = db.prepare('INSERT INTO publications (title, url, year, status, venue) VALUES (?, ?, ?, ?, ?)');
  const insertAuthor = db.prepare('INSERT INTO publication_authors (publication_id, author_name, is_self, sort_order) VALUES (?, ?, ?, ?)');

  let r = insertPub.run('Approximation Algorithms for the Minimum-Cost k-Connected Subgraph Problem', '#', 2025, 'Submitted', 'arXiv preprint arXiv:2501.XXXXX');
  insertAuthor.run(r.lastInsertRowid, 'N. Sobrenome', 1, 1);
  insertAuthor.run(r.lastInsertRowid, 'A. Coautor', 0, 2);
  insertAuthor.run(r.lastInsertRowid, 'B. Colaborador', 0, 3);

  r = insertPub.run('Online Graph Coloring with Predictions', '#', 2024, 'Accepted', 'SODA 2025 — ACM-SIAM Symposium on Discrete Algorithms');
  insertAuthor.run(r.lastInsertRowid, 'N. Sobrenome', 1, 1);
  insertAuthor.run(r.lastInsertRowid, 'C. Silva', 0, 2);
  insertAuthor.run(r.lastInsertRowid, 'D. Pereira', 0, 3);

  r = insertPub.run('A 2-Approximation for the Metric Traveling Salesman Problem via Thin Trees', '#', 2024, 'Published', 'Journal of the ACM, 71(3), 2024');
  insertAuthor.run(r.lastInsertRowid, 'A. Coautor', 0, 1);
  insertAuthor.run(r.lastInsertRowid, 'N. Sobrenome', 1, 2);
  insertAuthor.run(r.lastInsertRowid, 'E. Ferreira', 0, 3);

  console.log('  ✓ Sample publications created');
} else {
  console.log('  - Publications already exist');
}

// 6. Create sample events
const existingEvents = db.prepare("SELECT COUNT(*) as count FROM events").get();
if (existingEvents.count === 0) {
  const insertEvent = db.prepare(
    'INSERT INTO events (name, url, location, role, start_date, end_date, description, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertEvent.run(
    'Workshop on Ramsey Theory',
    'https://example.com/ramsey2026',
    'São Paulo, Brazil',
    'Organizer',
    '2026-07-15',
    '2026-07-18',
    'A workshop bringing together researchers working on Ramsey theory and related areas.',
    1
  );
  insertEvent.run(
    'International Conference on Graph Theory',
    'https://example.com/icgt2026',
    'Berlin, Germany',
    'Invited Speaker',
    '2026-09-07',
    '2026-09-11',
    'The premier international conference on graph theory and combinatorics.',
    1
  );
  insertEvent.run(
    'Brazilian Symposium on Combinatorics',
    'https://example.com/bsc2026',
    'Rio de Janeiro, Brazil',
    'Committee Member',
    '2026-11-20',
    '2026-11-22',
    'Annual symposium organized by the Brazilian combinatorics community.',
    1
  );
  console.log('  ✓ Sample events created');
} else {
  console.log('  - Events already exist');
}

console.log('\nDone! Run "npm run dev" to start the server.');
