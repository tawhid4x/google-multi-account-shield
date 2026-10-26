import { Logger } from '../shared/logger.js';
import { MESSAGES } from '../shared/constants.js';
import { handleAccountDiscovery } from './account-detector.js';
import { prepareNewAccountSlot, switchAccount } from './session-rotator.js';
import { CookieVault } from './cookie-vault.js';

Logger.info('Service Worker initialized.');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Logger.info('Received message:', message.type);

    if (message.type === MESSAGES.SYNC_DISCOVERED_ACCOUNTS) {
        handleAccountDiscovery(message.payload).then(() => {
            sendResponse({ success: true });
        }).catch(err => {
            Logger.error('Failed to sync discovered accounts:', err);
            sendResponse({ success: false, error: err.message });
        });
        return true;
    }

    if (message.type === MESSAGES.GET_VAULT_ACCOUNTS) {
        CookieVault.getAllAccounts().then(accounts => {
            sendResponse(accounts);
        }).catch(err => {
            Logger.error('Failed to get vault accounts:', err);
            sendResponse(null);
        });
        return true;
    }

    if (message.type === MESSAGES.SWITCH_ACCOUNT) {
        switchAccount(message.email).then(() => {
            sendResponse({ success: true });
        }).catch(err => {
            Logger.error(`Failed to switch to account ${message.email}:`, err);
            sendResponse({ success: false, error: err.message });
        });
        return true;
    }

    if (message.type === MESSAGES.PREPARE_NEW_ACCOUNT_SLOT) {
        prepareNewAccountSlot().then(() => {
            sendResponse({ success: true });
        }).catch(err => {
            Logger.error('Failed to prepare new account slot:', err);
            sendResponse({ success: false, error: err.message });
        });
        return true;
    }
});
