export const STORAGE_KEYS = {
    VAULT: 'gmas_account_vault',
    SETTINGS: 'gmas_settings'
};

export const DEFAULT_SETTINGS = {
    shieldEnabled: true,
    vaultEnabled: true,
    overflowProtection: true
};

export const GOOGLE_DOMAINS = [
    '.google.com',
    'accounts.google.com',
    'mail.google.com',
    '.youtube.com',
    'myaccount.google.com'
];

export const AUTH_COOKIES = [
    'SID', 'HSID', 'SSID', 'APISID', 'SAPISID',
    '__Secure-1PSID', '__Secure-3PSID', '__Secure-1PAPISID', '__Secure-3PAPISID',
    '__Secure-1PSIDTS', '__Secure-3PSIDTS', '__Secure-1PSIDCC', '__Secure-3PSIDCC',
    'SIDCC', 'LSID', '__Host-GAPS', '__Host-1PLSID', '__Host-3PLSID',
    'ACCOUNT_CHOOSER', 'SMSV', 'OSID', 'COMPASS', 'NID'
];

export const MESSAGES = {
    SYNC_DISCOVERED_ACCOUNTS: 'SYNC_DISCOVERED_ACCOUNTS',
    GET_VAULT_ACCOUNTS: 'GET_VAULT_ACCOUNTS',
    SWITCH_ACCOUNT: 'SWITCH_ACCOUNT',
    PREPARE_NEW_ACCOUNT_SLOT: 'PREPARE_NEW_ACCOUNT_SLOT'
};
