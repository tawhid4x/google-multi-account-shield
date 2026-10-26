import { StorageManager } from '../shared/storage-manager.js';
import { Logger } from '../shared/logger.js';
import { GOOGLE_DOMAINS, AUTH_COOKIES } from '../shared/constants.js';

export const CookieVault = {
    async getAllAccounts() {
        return await StorageManager.getVault();
    },

    async saveAccountMetadata(accountInfo) {
        const vault = await StorageManager.getVault();
        const email = accountInfo.email;
        if (!vault[email]) {
            vault[email] = {
                email: email,
                name: accountInfo.name,
                avatarUrl: accountInfo.avatarUrl,
                addedAt: Date.now(),
                lastActive: Date.now(),
                status: 'active_in_browser',
                cookies: [],
                notes: '',
                pinned: false
            };
        } else {
            vault[email] = {
                ...vault[email],
                name: accountInfo.name || vault[email].name,
                avatarUrl: accountInfo.avatarUrl || vault[email].avatarUrl,
                lastActive: accountInfo.isActive ? Date.now() : vault[email].lastActive
            };
        }
        await StorageManager.saveVault(vault);
    },

    async snapshotActiveCookies(email) {
        if (!email) return;
        const vault = await StorageManager.getVault();
        if (!vault[email]) {
            Logger.warn(`Cannot snapshot cookies for unknown account: ${email}`);
            return;
        }

        const allCookies = await this._getAllGoogleCookies();
        const authCookies = allCookies.filter(c => AUTH_COOKIES.includes(c.name));

        vault[email].cookies = authCookies;
        vault[email].status = 'vaulted_ready';
        vault[email].lastActive = Date.now();
        await StorageManager.saveVault(vault);
        Logger.info(`Snapshot complete for ${email}. Vaulted ${authCookies.length} cookies.`);
    },

    async restoreCookies(email) {
        const vault = await StorageManager.getVault();
        const account = vault[email];

        if (!account || !account.cookies || account.cookies.length === 0) {
            throw new Error(`No saved cookies found for ${email}`);
        }

        Logger.info(`Restoring cookies for ${email}...`);

        // Remove current cookies
        await this.clearActiveGoogleCookies();

        // Restore saved cookies
        for (const cookie of account.cookies) {
            let url = (cookie.secure ? 'https://' : 'http://') + (cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain) + cookie.path;

            const setDetails = {
                url: url,
                name: cookie.name,
                value: cookie.value,
                domain: cookie.hostOnly ? undefined : cookie.domain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite,
                storeId: cookie.storeId
            };

            if (cookie.expirationDate) {
                // Optionally extend expiration
                setDetails.expirationDate = cookie.expirationDate;
            }

            // Chrome API quirk: if the name starts with __Host-, domain must not be specified and path must be '/'
            if (cookie.name.startsWith('__Host-')) {
                delete setDetails.domain;
                setDetails.path = '/';
            }

            try {
                await chrome.cookies.set(setDetails);
            } catch (err) {
                Logger.error(`Failed to set cookie ${cookie.name} for ${url}:`, err);
            }
        }

        account.status = 'active_in_browser';
        account.lastActive = Date.now();
        await StorageManager.saveVault(vault);
        Logger.info(`Successfully restored cookies for ${email}.`);
    },

    async clearActiveGoogleCookies() {
        const allCookies = await this._getAllGoogleCookies();
        for (const cookie of allCookies) {
            if (AUTH_COOKIES.includes(cookie.name)) {
                let url = (cookie.secure ? 'https://' : 'http://') + (cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain) + cookie.path;
                try {
                    await chrome.cookies.remove({ url: url, name: cookie.name, storeId: cookie.storeId });
                } catch(e) {
                    Logger.warn(`Failed to remove cookie ${cookie.name}`, e);
                }
            }
        }
    },

    async _getAllGoogleCookies() {
        let allCookies = [];
        for (const domain of GOOGLE_DOMAINS) {
            const cookies = await chrome.cookies.getAll({ domain: domain });
            allCookies = allCookies.concat(cookies);
        }
        return allCookies;
    }
};

// Listen for cookie changes on primary accounts in case tokens refresh
let debounceTimer;
chrome.cookies.onChanged.addListener((changeInfo) => {
    // Only care about important auth cookies
    if (AUTH_COOKIES.includes(changeInfo.cookie.name)) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            // Re-snapshot the active primary account if we know it
            // For now, we rely on the periodic sync from account-detector,
            // but we could store the "currentActiveEmail" in memory here.
        }, 1500);
    }
});
