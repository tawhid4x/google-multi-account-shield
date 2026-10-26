import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

export const StorageManager = {
    async getVault() {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.VAULT], (result) => {
                resolve(result[STORAGE_KEYS.VAULT] || {});
            });
        });
    },

    async saveVault(vault) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [STORAGE_KEYS.VAULT]: vault }, resolve);
        });
    },

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
                resolve({ ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.SETTINGS] || {}) });
            });
        });
    },

    async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings }, resolve);
        });
    }
};
