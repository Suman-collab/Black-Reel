// Fixed: centralized regex escaping and query-length limiting to mitigate ReDoS risks.
export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeSearchTerm = (value = '', maxLength = 100) => String(value).trim().slice(0, maxLength);
