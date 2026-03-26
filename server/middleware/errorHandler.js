function errorHandler(err, req, res, _next) {
  console.error(err.stack || err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  // API requests get JSON
  if (req.path.startsWith('/api/')) {
    return res.status(status).json({ error: message });
  }

  // HTML requests get rendered error page
  res.status(status).render('pages/error', {
    title: `${status} — Error`,
    status,
    message,
    profile: null,
    sections: [],
    currentPath: req.path,
  });
}

module.exports = errorHandler;
