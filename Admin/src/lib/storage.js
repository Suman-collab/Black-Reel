const ADMIN_AUTH_STORAGE_KEY = 'blackreel-admin-auth';


export const getStoredAdminAuth = () => {
  try {
    const rawValue = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    return null;
  }
};

export const setStoredAdminAuth = (value) => {
  const safeValue = value?.user ? { user: value.user } : null;
  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(safeValue));
};

export const clearStoredAdminAuth = () => {
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
};
