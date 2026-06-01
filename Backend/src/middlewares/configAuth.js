import AppError from '../utils/AppError.js';
import { config } from '../config/index.js';

const normalizeClientHeader = (value = '') => String(value || '').trim().toLowerCase();

export const requireConfigClient = (req, res, next) => {
  const client = normalizeClientHeader(req.headers['x-config-client']);

  if (!client || !config.configApi.allowedClients.includes(client)) {
    next(new AppError('Forbidden: invalid config client.', 403));
    return;
  }

  req.configClient = client;
  next();
};

export const requireAdminConfigSecret = (req, res, next) => {
  const provided = String(req.headers['x-admin-secret'] || '').trim();
  if (!provided || provided !== config.admin.secretKey) {
    next(new AppError('Forbidden: invalid admin config secret.', 403));
    return;
  }
  next();
};

