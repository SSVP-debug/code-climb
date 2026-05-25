export const storageService = {

  get(key, defaultValue = null) {

    try {

      const value =
        localStorage.getItem(key);

      return value
        ? JSON.parse(value)
        : defaultValue;

    } catch {

      return defaultValue;

    }

  },

  set(key, value) {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  },

  remove(key) {

    localStorage.removeItem(key);

  },

};