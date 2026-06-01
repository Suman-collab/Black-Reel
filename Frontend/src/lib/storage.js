const AUTH_STORAGE_KEY = 'blackreel-user-auth';


export const getStoredAuth = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const setStoredAuth = (value) => {
  const safeValue = value?.user ? { user: value.user } : null;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeValue));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const AUTH_STORAGE_KEYS = {
  auth: AUTH_STORAGE_KEY,
};
