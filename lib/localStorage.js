// lib/localStorage.js
export const safeLocalStorage = {
    getItem: (key) => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key, value) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },
    removeItem: (key) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    },
    clear: () => {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    }
  };