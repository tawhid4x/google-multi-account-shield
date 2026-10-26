import { CookieVault } from './cookie-vault.js';
import { Logger } from '../shared/logger.js';
import { StorageManager } from '../shared/storage-manager.js';

let activeEmail = null; // Track currently active email for rotation

export function setActiveEmail(email) {
    activeEmail = email;
}

export async function switchAccount(targetEmail) {
    Logger.info(`Switching account to: ${targetEmail}`);
    const settings = await StorageManager.getSettings();
    if (!settings.vaultEnabled) {
        Logger.info('Vault is disabled, standard navigation fallback.');
        return reloadTabs();
    }

    // Backup current session before swapping
    if (activeEmail) {
        await CookieVault.snapshotActiveCookies(activeEmail);
    } else {
        // Fallback: we might have multiple active, snapshot all if possible
        // Account detector takes care of snapshotting primary.
    }

    const vault = await StorageManager.getVault();
    const targetAccount = vault[targetEmail];

    if (!targetAccount) {
        throw new Error('Account not found in vault.');
    }

    if (targetAccount.cookies && targetAccount.cookies.length > 0) {
        await CookieVault.restoreCookies(targetEmail);
        activeEmail = targetEmail;
        await reloadTabs();
    } else {
        // Account needs re-auth
        Logger.warn(`Account ${targetEmail} has no valid cookies. Navigating to AddSession.`);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const url = `https://accounts.google.com/AddSession?Email=${encodeURIComponent(targetEmail)}`;
                chrome.tabs.update(tabs[0].id, { url });
            }
        });
    }
}

export async function prepareNewAccountSlot() {
    Logger.info('Preparing new account slot...');
    const settings = await StorageManager.getSettings();
    if (settings.overflowProtection && activeEmail) {
        // Snapshot current account
        await CookieVault.snapshotActiveCookies(activeEmail);

        // Count active sessions (this is an approximation, real impl would check authuser tokens)
        // Here we aggressively clear local cookies to keep the jar fresh (safe because they are vaulted).
        Logger.info('Evicting local cookies to prevent 10-account limit overflow.');
        await CookieVault.clearActiveGoogleCookies();
    }
}

async function reloadTabs() {
    const tabs = await chrome.tabs.query({ url: "*://*.google.com/*" });
    const activeTab = tabs.find(t => t.active);
    if (activeTab) {
        // Reload active tab cleanly, stripping authuser
        let newUrl = new URL(activeTab.url);
        newUrl.searchParams.delete('authuser');
        newUrl.searchParams.set('authuser', '0');
        await chrome.tabs.update(activeTab.id, { url: newUrl.toString() });
    }
}
