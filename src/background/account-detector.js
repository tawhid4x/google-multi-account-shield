import { CookieVault } from './cookie-vault.js';
import { Logger } from '../shared/logger.js';
import { setActiveEmail } from './session-rotator.js';

export async function handleAccountDiscovery(accounts) {
    if (!Array.isArray(accounts)) return;

    Logger.info(`Received ${accounts.length} discovered accounts.`);

    for (const account of accounts) {
        if (!account.email) continue;

        await CookieVault.saveAccountMetadata(account);

        // If it's the currently active primary account and it's not signed out,
        // snapshot its valid cookies immediately.
        if (account.isActive && !account.isSignedOut) {
            setActiveEmail(account.email);
            await CookieVault.snapshotActiveCookies(account.email);
        }
    }
}
