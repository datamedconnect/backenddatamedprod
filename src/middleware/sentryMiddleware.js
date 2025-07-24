// const Sentry = require('../config/instruments'); // Adjust path if needed

// // Custom Sentry middleware wrapper
// const sentryMiddleware = (req, res, next) => {
//   // Start Sentry request handling (captures context like URL, method, body)
//   Sentry.Handlers.requestHandler()(req, res, () => {
//     // Add a breadcrumb for the incoming request
//     Sentry.addBreadcrumb({
//       category: 'http',
//       message: `Requête API: ${req.method} ${req.path}`,
//       level: 'info',
//       data: {
//         query: req.query, // Add query params for more context
//         user_agent: req.headers['user-agent'], // Browser/OS info
//       },
//     });

//     // If user is authenticated, set user context (who did the action)
//     if (req.user && req.user.id) {
//       Sentry.setUser({
//         id: req.user.id,
//         email: req.user.email, // Add email if available
//         role: req.user.role, // Add role if available
//       });
//       Sentry.setTag('utilisateur_role', req.user.role || 'inconnu'); // French tag
//     } else {
//       // For unauthenticated requests, set a fallback user with IP (requires sendDefaultPii: true)
//       Sentry.setUser({
//         ip_address: '{{auto}}', // Sentry will auto-fill the IP
//       });
//       Sentry.setTag('utilisateur_role', 'non_authentifié'); // Tag for filtering unauth errors
//     }

//     // Proceed to next middleware/controller
//     next();
//   });
// };

// // Error-handling middleware (place after all routes)
// const sentryErrorHandler = (err, req, res, next) => {
//   // Sanitize request body to avoid logging sensitive data (e.g., passwords)
//   const sanitizedBody = { ...req.body };
//   if (sanitizedBody.password) {
//     sanitizedBody.password = '[REDACTED]';
//   }
//   if (sanitizedBody.token) {
//     sanitizedBody.token = '[REDACTED]';
//   }

//   // Use configureScope for compatibility with older Sentry SDK versions
//   Sentry.configureScope((scope) => {
//     // Add extra details about the request
//     scope.setExtras({
//       chemin: req.path,
//       methode: req.method,
//       body: JSON.stringify(sanitizedBody || {}), // Use sanitized body
//       query: req.query,
//       user_agent: req.headers['user-agent'],
//       status_code: res.statusCode, // Include response status
//     });

//     // Add a breadcrumb for the error occurrence
//     scope.addBreadcrumb({
//       category: 'error',
//       message: `Erreur survenue: ${err.message || 'Inconnue'}`,
//       level: 'error',
//       data: {
//         stack: err.stack?.split('\n').slice(0, 5).join('\n'), // First few lines of stack trace
//       },
//     });

//     // Set a custom French error name if possible
//     const errorMessage = err.message || 'Erreur serveur interne';
//     scope.setTag('type_erreur', 'Erreur API'); // Custom French tag for filtering in Sentry dashboard
//   });

//   // Capture the error
//   Sentry.captureException(err);

//   // Let Sentry's error handler process it
//   Sentry.Handlers.errorHandler()(err, req, res, () => {
//     // Ensure a response is sent if Sentry's handler doesn't
//     if (!res.headersSent) {
//       res.status(500).json({ message: 'Erreur serveur interne' });
//     }
//     next();
//   });
// };

// // Export both (use sentryMiddleware before routes, sentryErrorHandler after)
// module.exports = { sentryMiddleware, sentryErrorHandler };