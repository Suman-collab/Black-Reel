const SUSPENSION_STORAGE_KEY = 'blackreel-account-suspension';

const readSessionValue = () => {
  try {
    const rawValue = sessionStorage.getItem(SUSPENSION_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    sessionStorage.removeItem(SUSPENSION_STORAGE_KEY);
    return null;
  }
};

export const getStoredSuspension = () => readSessionValue();

export const setStoredSuspension = (value) => {
  try {
    sessionStorage.setItem(SUSPENSION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    
  }
};

export const clearStoredSuspension = () => {
  try {
    sessionStorage.removeItem(SUSPENSION_STORAGE_KEY);
  } catch {
    
  }
};
