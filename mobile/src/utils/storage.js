import * as SecureStore from 'expo-secure-store';

export const storage = {
  async get(key) {
    try { return await SecureStore.getItemAsync(key); }
    catch { return null; }
  },
  async set(key, value) {
    try { await SecureStore.setItemAsync(key, String(value)); return true; }
    catch { return false; }
  },
  async delete(key) {
    try { await SecureStore.deleteItemAsync(key); return true; }
    catch { return false; }
  },
};
