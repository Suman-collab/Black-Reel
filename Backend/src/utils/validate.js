import AppError from './AppError.js';

export const validate = (schema, payload) => {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    throw new AppError(message || 'Invalid request payload', 400);
  }

  return result.data;
};

export const toBoolean = (value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};
