import { config } from '../config/index.js';

const logConfigAccess = (req, scope) => {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'config_access',
      scope,
      client: req.configClient || null,
      ip: req.ip || req.headers['x-forwarded-for'] || null,
      path: req.originalUrl,
    })
  );
};

export const getPublicConfig = (req, res) => {
  logConfigAccess(req, 'public');

  res.status(200).json({
    appName: config.frontend.appName,
    googleClientId: config.frontend.googleClientId,
    firebaseApiKey: config.firebase.webApiKey,
    firebaseAuthDomain: config.firebase.webAuthDomain,
    firebaseProjectId: config.firebase.webProjectId,
    stripePublishableKey: config.stripe.publishableKey,
    env: config.app.env,
  });
};

export const getAdminConfig = (req, res) => {
  logConfigAccess(req, 'admin');

  res.status(200).json({
    adminApiUrl: `${config.app.url.replace(/\/$/, '')}/api/admin`,
    firebaseProjectId: config.firebase.webProjectId,
    env: config.app.env,
  });
};

