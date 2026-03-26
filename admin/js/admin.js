/* ── Admin Panel SPA ──────────────────────────────────────────── */
(function () {
  'use strict';

  let token = localStorage.getItem('admin_token');

  // DOM refs
  const loginScreen = document.getElementById('login-screen');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const content = document.getElementById('admin-content');
  const pageTitle = document.getElementById('page-title');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');

  // ── API Helper ────────────────────────────────────────────────
  async function api(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function toast(msg, type = 'success') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ── Auth ──────────────────────────────────────────────────────
  async function checkAuth() {
    if (!token) return showLogin();
    try {
      await api('/api/auth/verify');
      showDashboard();
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    loginScreen.style.display = '';
    dashboard.style.display = 'none';
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = '';
    navigateTo('dashboard');
  }

  function logout() {
    token = null;
    localStorage.removeItem('admin_token');
    showLogin();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const data = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(r => r.json());
      if (data.token) {
        token = data.token;
        localStorage.setItem('admin_token', token);
        showDashboard();
      } else {
        loginError.textContent = data.error || 'Login failed';
      }
    } catch (err) {
      loginError.textContent = 'Connection error';
    }
  });

  logoutBtn.addEventListener('click', logout);

  // Sidebar mobile toggle
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  // ── Navigation ────────────────────────────────────────────────
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      sidebar.classList.remove('open');
      navigateTo(link.dataset.page);
    });
  });

  function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    const titles = { dashboard: 'Dashboard', profile: 'Profile', sections: 'Sections', publications: 'Publications', events: 'Events' };
    pageTitle.textContent = titles[page] || page;

    switch (page) {
      case 'dashboard': renderDashboard(); break;
      case 'profile': renderProfile(); break;
      case 'sections': renderSections(); break;
      case 'publications': renderPublications(); break;
      case 'events': renderEvents(); break;
    }
  }

  // ── Dashboard Page ────────────────────────────────────────────
  async function renderDashboard() {
    const [sections, pubs, profile, events] = await Promise.all([
      api('/api/admin/sections'),
      api('/api/admin/publications'),
      api('/api/admin/profile'),
      api('/api/admin/events'),
    ]);

    const active = sections.filter(s => s.is_active).length;
    const featuredEvents = events.filter(e => e.is_featured).length;

    content.innerHTML = `
      <div class="dash-grid">
        <div class="dash-card active">
          <h4>Active Sections</h4>
          <div class="dash-value">${active} / ${sections.length}</div>
        </div>
        <div class="dash-card">
          <h4>Publications</h4>
          <div class="dash-value">${pubs.length}</div>
        </div>
        <div class="dash-card">
          <h4>Events</h4>
          <div class="dash-value">${events.length} <span style="font-size:0.75rem;color:var(--admin-muted);">(${featuredEvents} featured)</span></div>
        </div>
        <div class="dash-card">
          <h4>Profile</h4>
          <div class="dash-value">${profile.name || 'Not set'}</div>
        </div>
      </div>

      <div class="form-card">
        <h3>Quick Actions</h3>
        <div style="display:flex;gap:0.8rem;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="document.querySelector('[data-page=profile]').click()">Edit Profile</button>
          <button class="btn btn-outline" onclick="document.querySelector('[data-page=sections]').click()">Manage Sections</button>
          <button class="btn btn-outline" onclick="document.querySelector('[data-page=publications]').click()">Manage Publications</button>
          <button class="btn btn-outline" onclick="document.querySelector('[data-page=events]').click()">Manage Events</button>
        </div>
      </div>

      <div class="form-card">
        <h3>Sections Status</h3>
        <div class="section-list">
          ${sections.map(s => `
            <div class="section-row" style="border-left:4px solid ${s.is_active ? 'var(--admin-success)' : 'var(--admin-border)'}">
              <div class="section-info">
                <span class="section-name">${s.name}</span>
                <span class="section-slug">/${s.slug}</span>
              </div>
              <span style="font-size:0.78rem;color:${s.is_active ? 'var(--admin-success)' : 'var(--admin-muted)'}">
                ${s.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ── Profile Page ──────────────────────────────────────────────
  async function renderProfile() {
    const profile = await api('/api/admin/profile');
    const links = profile.links || [];

    content.innerHTML = `
      <form id="profile-form">
        <div class="form-card">
          <h3>Photo</h3>
          <div style="display:flex;align-items:center;gap:1.5rem;">
            ${profile.photo_path
              ? `<img src="${profile.photo_path}" style="width:80px;height:80px;border-radius:10px;object-fit:cover;" />`
              : `<div style="width:80px;height:80px;border-radius:10px;background:#eee;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:2rem;">?</div>`
            }
            <div>
              <input type="file" id="photo-input" accept="image/*" />
              <button type="button" id="upload-photo-btn" class="btn btn-outline btn-sm" style="margin-top:0.5rem;">Upload Photo</button>
            </div>
          </div>
        </div>

        <div class="form-card">
          <h3>Personal Information</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value="${esc(profile.name)}" required />
            </div>
            <div class="form-group">
              <label>Title / Position</label>
              <input type="text" name="title" value="${esc(profile.title)}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Department</label>
              <input type="text" name="department" value="${esc(profile.department)}" />
            </div>
            <div class="form-group">
              <label>Institute</label>
              <input type="text" name="institute" value="${esc(profile.institute)}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>University</label>
              <input type="text" name="university" value="${esc(profile.university)}" />
            </div>
            <div class="form-group">
              <label>Country</label>
              <input type="text" name="country" value="${esc(profile.country)}" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${esc(profile.email)}" />
          </div>
          <div class="form-group">
            <label>Research Interests</label>
            <textarea name="research_interests" rows="2" style="min-height:60px;font-family:inherit;">${esc(profile.research_interests)}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Research Group Name</label>
              <input type="text" name="group_name" value="${esc(profile.group_name)}" />
            </div>
            <div class="form-group">
              <label>Research Group URL</label>
              <input type="url" name="group_url" value="${esc(profile.group_url)}" />
            </div>
          </div>
          <div class="form-group">
            <label>Footer Address</label>
            <textarea name="footer_address" rows="3" style="min-height:80px;font-family:inherit;">${esc(profile.footer_address)}</textarea>
          </div>
        </div>

        <div class="form-card">
          <h3>Academic Links</h3>
          <div id="links-container">
            ${links.map((l, i) => linkRow(l, i)).join('')}
          </div>
          <button type="button" id="add-link-btn" class="btn btn-outline btn-sm" style="margin-top:0.5rem;">+ Add Link</button>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save Profile</button>
        </div>
      </form>
    `;

    // Photo upload
    document.getElementById('upload-photo-btn').addEventListener('click', async () => {
      const file = document.getElementById('photo-input').files[0];
      if (!file) return toast('Select a file first', 'error');
      const fd = new FormData();
      fd.append('photo', file);
      try {
        await api('/api/admin/profile/photo', { method: 'POST', body: fd });
        toast('Photo uploaded');
        renderProfile();
      } catch (err) { toast(err.message, 'error'); }
    });

    // Add link
    document.getElementById('add-link-btn').addEventListener('click', () => {
      const container = document.getElementById('links-container');
      const idx = container.children.length;
      container.insertAdjacentHTML('beforeend', linkRow({ label: '', url: '', icon: '' }, idx));
    });

    // Remove link delegation
    content.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-link-btn')) {
        e.target.closest('.author-row').remove();
      }
    });

    // Save profile
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);

      // Collect links
      const linkLabels = content.querySelectorAll('[name^="link_label"]');
      const linkUrls = content.querySelectorAll('[name^="link_url"]');
      const linkIcons = content.querySelectorAll('[name^="link_icon"]');
      data.links = [];
      linkLabels.forEach((el, i) => {
        data.links.push({
          label: el.value,
          url: linkUrls[i].value,
          icon: linkIcons[i].value,
        });
      });

      try {
        await api('/api/admin/profile', { method: 'PUT', body: JSON.stringify(data) });
        toast('Profile saved');
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  function linkRow(link, idx) {
    return `
      <div class="author-row" style="margin-bottom:0.4rem;">
        <input name="link_label_${idx}" placeholder="Label (e.g. ORCID)" value="${esc(link.label)}" style="flex:1" />
        <input name="link_url_${idx}" placeholder="URL" value="${esc(link.url)}" style="flex:2" />
        <select name="link_icon_${idx}" style="width:110px">
          <option value="arxiv" ${link.icon === 'arxiv' ? 'selected' : ''}>ArXiv</option>
          <option value="orcid" ${link.icon === 'orcid' ? 'selected' : ''}>ORCID</option>
          <option value="scholar" ${link.icon === 'scholar' ? 'selected' : ''}>Scholar</option>
          <option value="lattes" ${link.icon === 'lattes' ? 'selected' : ''}>Lattes</option>
          <option value="other" ${link.icon === 'other' ? 'selected' : ''}>Other</option>
        </select>
        <button type="button" class="btn btn-danger btn-sm remove-link-btn">×</button>
      </div>
    `;
  }

  // ── Sections Page ─────────────────────────────────────────────
  async function renderSections() {
    const sections = await api('/api/admin/sections');

    content.innerHTML = `
      <div class="section-list" id="sections-list">
        ${sections.map(s => `
          <div class="section-row">
            <div class="section-info">
              <span class="section-name">${s.name}</span>
              <span class="section-slug">/${s.slug}</span>
            </div>
            <div class="section-actions">
              ${s.slug !== 'publications' ? `<button class="btn btn-outline btn-sm" data-edit-section="${s.slug}">Edit Content</button>` : ''}
              <label class="toggle">
                <input type="checkbox" ${s.is_active ? 'checked' : ''} data-toggle-section="${s.slug}" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        `).join('')}
      </div>
      <div id="section-editor-area"></div>
    `;

    // Toggle handlers
    content.querySelectorAll('[data-toggle-section]').forEach(input => {
      input.addEventListener('change', async () => {
        try {
          await api(`/api/admin/sections/${input.dataset.toggleSection}/toggle`, { method: 'PUT' });
          toast('Section toggled');
        } catch (err) { toast(err.message, 'error'); }
      });
    });

    // Edit content handlers
    content.querySelectorAll('[data-edit-section]').forEach(btn => {
      btn.addEventListener('click', () => openSectionEditor(btn.dataset.editSection));
    });
  }

  async function openSectionEditor(slug) {
    const section = await api(`/api/sections/${slug}`);
    const area = document.getElementById('section-editor-area');

    area.innerHTML = `
      <div class="form-card" style="margin-top:1.5rem;">
        <h3>Edit: ${section.name}</h3>
        <p style="font-size:0.78rem;color:var(--admin-muted);margin-bottom:1rem;">Content uses Markdown syntax</p>
        <div class="editor-wrapper">
          <div class="editor-tabs">
            <button class="editor-tab active" data-tab="write">Write</button>
            <button class="editor-tab" data-tab="preview">Preview</button>
          </div>
          <div id="write-panel">
            <div class="form-group" style="margin:0">
              <textarea id="section-content" rows="15">${esc(section.content)}</textarea>
            </div>
          </div>
          <div id="preview-panel" class="editor-preview" style="display:none;"></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="save-section-btn">Save Content</button>
          <button class="btn btn-outline" id="cancel-section-btn">Cancel</button>
        </div>
      </div>
    `;

    // Tab switching
    area.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        area.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (tab.dataset.tab === 'preview') {
          document.getElementById('write-panel').style.display = 'none';
          const preview = document.getElementById('preview-panel');
          preview.style.display = '';
          // Simple Markdown to HTML (basic)
          preview.innerHTML = simpleMarkdown(document.getElementById('section-content').value);
        } else {
          document.getElementById('write-panel').style.display = '';
          document.getElementById('preview-panel').style.display = 'none';
        }
      });
    });

    document.getElementById('save-section-btn').addEventListener('click', async () => {
      const c = document.getElementById('section-content').value;
      try {
        await api(`/api/admin/sections/${slug}/content`, { method: 'PUT', body: JSON.stringify({ content: c }) });
        toast('Content saved');
        area.innerHTML = '';
      } catch (err) { toast(err.message, 'error'); }
    });

    document.getElementById('cancel-section-btn').addEventListener('click', () => {
      area.innerHTML = '';
    });
  }

  // ── Publications Page ─────────────────────────────────────────
  async function renderPublications() {
    const pubs = await api('/api/admin/publications');

    content.innerHTML = `
      <div class="pub-toolbar">
        <input type="text" id="pub-search" placeholder="Search publications..." />
        <button class="btn btn-primary" id="add-pub-btn">+ New Publication</button>
      </div>
      <div class="pub-table">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Title</th>
              <th>Authors</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="pub-tbody">
            ${pubs.map(pubRow).join('')}
          </tbody>
        </table>
      </div>
    `;

    if (pubs.length === 0) {
      document.getElementById('pub-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--admin-muted);padding:2rem;">No publications yet</td></tr>';
    }

    // Search
    document.getElementById('pub-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#pub-tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    // Add new
    document.getElementById('add-pub-btn').addEventListener('click', () => openPubModal());

    // Edit/Delete delegation
    content.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit-pub]');
      const delBtn = e.target.closest('[data-delete-pub]');
      if (editBtn) openPubModal(parseInt(editBtn.dataset.editPub));
      if (delBtn) deletePub(parseInt(delBtn.dataset.deletePub));
    });
  }

  function pubRow(pub) {
    const statusClass = 'status-' + pub.status.toLowerCase().replace(/\s+/g, '-');
    const authors = pub.authors ? pub.authors.map(a => a.is_self ? `<strong>${esc(a.author_name)}</strong>` : esc(a.author_name)).join(', ') : '';
    return `
      <tr>
        <td>${pub.year}</td>
        <td class="pub-title-cell">${esc(pub.title)}</td>
        <td style="font-size:0.82rem;">${authors}</td>
        <td><span class="status-badge ${statusClass}">${pub.status}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn btn-outline btn-sm" data-edit-pub="${pub.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-delete-pub="${pub.id}">Del</button>
          </div>
        </td>
      </tr>
    `;
  }

  async function openPubModal(id) {
    let pub = { title: '', url: '', year: new Date().getFullYear(), status: 'Submitted', venue: '', authors: [] };
    if (id) {
      pub = await api(`/api/admin/publications/${id}`);
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3>${id ? 'Edit' : 'New'} Publication</h3>
        <form id="pub-modal-form">
          <div class="form-group">
            <label>Title</label>
            <input type="text" name="title" value="${esc(pub.title)}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Year</label>
              <input type="number" name="year" value="${pub.year}" required />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select name="status">
                ${['Submitted', 'Published', 'Accepted', 'To appear', 'Preprint'].map(s =>
                  `<option ${pub.status === s ? 'selected' : ''}>${s}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>URL</label>
            <input type="url" name="url" value="${esc(pub.url)}" />
          </div>
          <div class="form-group">
            <label>Venue / Journal</label>
            <input type="text" name="venue" value="${esc(pub.venue)}" />
          </div>
          <div class="form-group">
            <label>Authors</label>
            <div id="modal-authors">
              ${(pub.authors.length ? pub.authors : [{ author_name: '', is_self: 0 }]).map((a, i) => authorRow(a, i)).join('')}
            </div>
            <button type="button" id="modal-add-author" class="btn btn-outline btn-sm" style="margin-top:0.5rem;">+ Add Author</button>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">${id ? 'Update' : 'Create'}</button>
            <button type="button" class="btn btn-outline" id="modal-cancel">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#modal-add-author').addEventListener('click', () => {
      const c = overlay.querySelector('#modal-authors');
      c.insertAdjacentHTML('beforeend', authorRow({ author_name: '', is_self: 0 }, c.children.length));
    });

    overlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-author-btn')) {
        e.target.closest('.author-row').remove();
      }
    });

    overlay.querySelector('#pub-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      data.year = parseInt(data.year);

      // Collect authors
      const names = overlay.querySelectorAll('[name^="author_name_"]');
      const selfs = overlay.querySelectorAll('[name^="author_self_"]');
      data.authors = [];
      names.forEach((el, i) => {
        if (el.value.trim()) {
          data.authors.push({
            author_name: el.value.trim(),
            is_self: selfs[i] && selfs[i].checked ? 1 : 0,
          });
        }
      });

      try {
        if (id) {
          await api(`/api/admin/publications/${id}`, { method: 'PUT', body: JSON.stringify(data) });
          toast('Publication updated');
        } else {
          await api('/api/admin/publications', { method: 'POST', body: JSON.stringify(data) });
          toast('Publication created');
        }
        overlay.remove();
        renderPublications();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  function authorRow(author, idx) {
    return `
      <div class="author-row">
        <input name="author_name_${idx}" placeholder="Author name" value="${esc(author.author_name)}" style="flex:1" />
        <label class="self-check">
          <input type="checkbox" name="author_self_${idx}" ${author.is_self ? 'checked' : ''} /> Me
        </label>
        <button type="button" class="btn btn-danger btn-sm remove-author-btn">×</button>
      </div>
    `;
  }

  async function deletePub(id) {
    if (!confirm('Delete this publication?')) return;
    try {
      await api(`/api/admin/publications/${id}`, { method: 'DELETE' });
      toast('Publication deleted');
      renderPublications();
    } catch (err) { toast(err.message, 'error'); }
  }

  // ── Events Page ──────────────────────────────────────────────
  async function renderEvents() {
    const events = await api('/api/admin/events');

    content.innerHTML = `
      <div class="pub-toolbar">
        <input type="text" id="evt-search" placeholder="Search events..." />
        <button class="btn btn-primary" id="add-evt-btn">+ New Event</button>
      </div>
      <div class="pub-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Location</th>
              <th>Role</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="evt-tbody">
            ${events.map(eventRow).join('')}
          </tbody>
        </table>
      </div>
    `;

    if (events.length === 0) {
      document.getElementById('evt-tbody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--admin-muted);padding:2rem;">No events yet</td></tr>';
    }

    // Search
    document.getElementById('evt-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#evt-tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    // Add new
    document.getElementById('add-evt-btn').addEventListener('click', () => openEventModal());

    // Edit/Delete/Feature delegation
    content.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-edit-evt]');
      const delBtn = e.target.closest('[data-delete-evt]');
      const featBtn = e.target.closest('[data-feature-evt]');
      if (editBtn) openEventModal(parseInt(editBtn.dataset.editEvt));
      if (delBtn) deleteEvent(parseInt(delBtn.dataset.deleteEvt));
      if (featBtn) {
        try {
          await api(`/api/admin/events/${featBtn.dataset.featureEvt}/feature`, { method: 'PUT' });
          toast('Featured status toggled');
          renderEvents();
        } catch (err) { toast(err.message, 'error'); }
      }
    });
  }

  function eventRow(evt) {
    const d = new Date(evt.start_date + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let dateStr = months[d.getMonth()] + ' ' + d.getFullYear();
    if (evt.end_date) {
      const ed = new Date(evt.end_date + 'T00:00:00');
      if (d.getMonth() === ed.getMonth() && d.getFullYear() === ed.getFullYear()) {
        dateStr = d.getDate() + '-' + ed.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
      } else {
        dateStr = d.getDate() + ' ' + months[d.getMonth()] + ' - ' + ed.getDate() + ' ' + months[ed.getMonth()] + ' ' + ed.getFullYear();
      }
    }
    return `
      <tr>
        <td style="white-space:nowrap;">${dateStr}</td>
        <td class="pub-title-cell">${esc(evt.name)}</td>
        <td style="font-size:0.82rem;">${esc(evt.location)}</td>
        <td><span class="status-badge">${esc(evt.role)}</span></td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" data-feature-evt="${evt.id}" title="Toggle featured" style="font-size:0.9rem;">${evt.is_featured ? '⭐' : '☆'}</button>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn btn-outline btn-sm" data-edit-evt="${evt.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-delete-evt="${evt.id}">Del</button>
          </div>
        </td>
      </tr>
    `;
  }

  async function openEventModal(id) {
    let evt = { name: '', url: '', location: '', role: 'Attendee', start_date: '', end_date: '', description: '', is_featured: 1 };
    if (id) {
      evt = await api(`/api/admin/events/${id}`);
    }

    const roles = ['Invited Speaker', 'Organizer', 'Committee Member', 'Attendee', 'Presenter', 'Other'];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3>${id ? 'Edit' : 'New'} Event</h3>
        <form id="evt-modal-form">
          <div class="form-group">
            <label>Event Name</label>
            <input type="text" name="name" value="${esc(evt.name)}" required />
          </div>
          <div class="form-group">
            <label>Event URL</label>
            <input type="text" name="url" value="${esc(evt.url)}" placeholder="https://..." />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Location (City, Country)</label>
              <input type="text" name="location" value="${esc(evt.location)}" />
            </div>
            <div class="form-group">
              <label>Role / Participation</label>
              <select name="role">
                ${roles.map(r => `<option ${evt.role === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" name="start_date" value="${evt.start_date}" required />
            </div>
            <div class="form-group">
              <label>End Date (optional)</label>
              <input type="date" name="end_date" value="${evt.end_date || ''}" />
            </div>
          </div>
          <div class="form-group">
            <label>Description (optional)</label>
            <textarea name="description" rows="3">${esc(evt.description)}</textarea>
          </div>
          <div class="form-group">
            <label class="self-check" style="display:inline-flex;align-items:center;gap:0.5rem;">
              <input type="checkbox" name="is_featured" ${evt.is_featured ? 'checked' : ''} /> Featured on homepage
            </label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">${id ? 'Update' : 'Create'}</button>
            <button type="button" class="btn btn-outline" id="evt-modal-cancel">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#evt-modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#evt-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      data.is_featured = overlay.querySelector('[name="is_featured"]').checked ? 1 : 0;

      try {
        if (id) {
          await api(`/api/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
          toast('Event updated');
        } else {
          await api('/api/admin/events', { method: 'POST', body: JSON.stringify(data) });
          toast('Event created');
        }
        overlay.remove();
        renderEvents();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    try {
      await api(`/api/admin/events/${id}`, { method: 'DELETE' });
      toast('Event deleted');
      renderEvents();
    } catch (err) { toast(err.message, 'error'); }
  }

  // ── Simple Markdown Preview ───────────────────────────────────
  function simpleMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n{2,}/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  // ── Escape HTML ───────────────────────────────────────────────
  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Init ──────────────────────────────────────────────────────
  checkAuth();
})();
