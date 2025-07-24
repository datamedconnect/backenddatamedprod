const Sentry = require('../config/instruments'); // Adjust path if needed

const sentryMiddleware = (req, res, next) => {
  Sentry.Handlers.requestHandler()(req, res, () => {
    Sentry.addBreadcrumb({
      category: 'http',
      message: `Requête API: ${req.method} ${req.path}`,
      level: 'info',
      data: {
        query: req.query, // Add query params for more context
        user_agent: req.headers['user-agent'], // Browser/OS info
      },
    });

    if (req.user && req.user.id) {
      Sentry.setUser({
        id: req.user.id,
        email: req.user.email, // Add email if available
        role: req.user.role, // Add role if available
      });
      Sentry.setTag('utilisateur_role', req.user.role || 'inconnu'); // French tag
    } else {
      // For unauthenticated requests, set a fallback user with IP (requires sendDefaultPii: true)
      Sentry.setUser({
        ip_address: '{{auto}}', // Sentry will auto-fill the IP
      });
      Sentry.setTag('utilisateur_role', 'non_authentifié'); // Tag for filtering unauth errors
    }

    // Proceed to next middleware/controller
    next();
  });
};

// Error-handling middleware (place after all routes)
const sentryErrorHandler = (err, req, res, next) => {
  // Set scope for additional context specific to the error
  Sentry.withScope((scope) => {
    // Add extra details about the request
    scope.setExtras({
      chemin: req.path,
      methode: req.method,
      body: JSON.stringify(req.body || {}), // Capture request body (sanitize sensitive data if needed, e.g., delete passwords)
      query: req.query,
      user_agent: req.headers['user-agent'],
      status_code: res.statusCode, // Include response status
    });

    // Add a breadcrumb for the error occurrence
    Sentry.addBreadcrumb({
      category: 'error',
      message: `Erreur survenue: ${err.message || 'Inconnue'}`,
      level: 'error',
      data: {
        stack: err.stack?.split('\n').slice(0, 5).join('\n'), // First few lines of stack trace
      },
    });

    // Set a custom French error name if possible
    const errorMessage = err.message || 'Erreur serveur interne';
    scope.setTag('type_erreur', 'Erreur API'); // Custom French tag for filtering in Sentry dashboard

    // Capture the error
    Sentry.captureException(err);
  });

  // Let Sentry's error handler process it (this will also handle sending the error response if configured)
  Sentry.Handlers.errorHandler()(err, req, res, next);
};

// Export both (use sentryMiddleware before routes, sentryErrorHandler after)
module.exports = { sentryMiddleware, sentryErrorHandler };