import { toast as reactToast } from 'react-toastify';


const DEFAULT_OPTIONS = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'dark',
};


const getToastOptions = (message, customOptions = {}) => {
  return {
    ...DEFAULT_OPTIONS,
    
    toastId: customOptions.toastId !== undefined ? customOptions.toastId : String(message),
    ...customOptions,
  };
};

export const toast = {
  
  success: (message, options = {}) => {
    return reactToast.success(message, getToastOptions(message, options));
  },

  
  error: (message, options = {}) => {
    return reactToast.error(message, getToastOptions(message, options));
  },

  
  warning: (message, options = {}) => {
    return reactToast.warn(message, getToastOptions(message, options));
  },

  
  info: (message, options = {}) => {
    return reactToast.info(message, getToastOptions(message, options));
  },

  
  promise: (promise, { pending, success, error }, options = {}) => {
    return reactToast.promise(
      promise,
      {
        pending: pending || 'Loading details...',
        success: {
          render({ data }) {
            if (typeof success === 'function') {
              return success(data);
            }
            return success || 'Operation completed successfully.';
          },
        },
        error: {
          render({ data }) {
            if (typeof error === 'function') {
              return error(data);
            }
            
            const rawErrorMsg = data?.response?.data?.message || data?.message || data;
            return rawErrorMsg || error || 'Something went wrong. Please try again.';
          },
        },
      },
      {
        ...DEFAULT_OPTIONS,
        ...options,
      }
    );
  },

  
  dismiss: (toastId) => {
    reactToast.dismiss(toastId);
  },

  
  clear: () => {
    reactToast.dismiss();
  },
};
