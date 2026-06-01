import logger from '../config/logger.js';

export const logSecurityAuditEvent = (event, details = {}) => {
  
  logger.warn({
    event,
    ...details,
  });
};

export const logSuspensionAction = ({ actorUserId, targetUserId, previousStatus, nextStatus }) => {
  logSecurityAuditEvent('account_status_changed', {
    actorUserId: actorUserId ? String(actorUserId) : null,
    targetUserId: targetUserId ? String(targetUserId) : null,
    previousStatus,
    nextStatus,
  });
};

export const logBlockedAccessAttempt = ({ userId, email, status, path, method, reason }) => {
  logSecurityAuditEvent('blocked_access_attempt', {
    userId: userId ? String(userId) : null,
    email: email || null,
    status: status || null,
    path: path || null,
    method: method || null,
    reason: reason || null,
  });
};
