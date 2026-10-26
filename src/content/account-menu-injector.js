// Core Engine 3: Native Menu DOM Injector
console.log('[Google Account Shield] Account Menu Injector loaded.');

function isGoogleMenu() {
    return window.location.hostname === 'accounts.google.com' &&
           (window.location.pathname.includes('SignOutOptions') || window.location.pathname.includes('ListAccounts'));
}

function discoverAccounts() {
    // Basic DOM scraping to find logged-in accounts
    const accounts = [];

    // Look for active account in header (aria-label often has "Google Account: Name (email)")
    const activeAccEl = document.querySelector('[aria-label^="Google Account:"]');
    if (activeAccEl) {
        const aria = activeAccEl.getAttribute('aria-label');
        const emailMatch = aria.match(/\(([^)]+@[^)]+)\)/);
        const nameMatch = aria.match(/Google Account:\s*([^(]+)/);

        if (emailMatch) {
            accounts.push({
                email: emailMatch[1].toLowerCase(),
                name: nameMatch ? nameMatch[1].trim() : emailMatch[1],
                avatarUrl: activeAccEl.querySelector('img') ? activeAccEl.querySelector('img').src : '',
                isActive: true,
                isSignedOut: false
            });
        }
    }

    // Attempt to find other accounts in lists
    const accountRows = document.querySelectorAll('li, div[role="link"]');
    accountRows.forEach(row => {
        const text = row.textContent.trim();
        if (text.includes('@')) {
            const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            if (emailMatch) {
                const email = emailMatch[1].toLowerCase();
                const isSignedOut = text.toLowerCase().includes('signed out');

                // We could do better extraction here, but this works as a baseline
                accounts.push({
                    email,
                    name: email, // Placeholder if we can't extract name cleanly
                    avatarUrl: row.querySelector('img') ? row.querySelector('img').src : '',
                    isActive: false,
                    isSignedOut
                });
            }
        }
    });

    if (accounts.length > 0) {
        chrome.runtime.sendMessage({
            type: 'SYNC_DISCOVERED_ACCOUNTS',
            payload: accounts
        });
    }
}

function injectVaultUI() {
    if (!isGoogleMenu()) return;

    chrome.runtime.sendMessage({ type: 'GET_VAULT_ACCOUNTS' }, (vaultAccounts) => {
        if (!vaultAccounts) return;

        const vaultEmails = Object.keys(vaultAccounts);
        if (vaultEmails.length === 0) return;

        // Try to find the list container above "+ Add another account"
        const addAccountBtn = Array.from(document.querySelectorAll('a, div, li')).find(el =>
            el.textContent.toLowerCase().includes('add another account')
        );

        if (!addAccountBtn) return;

        let container = addAccountBtn.parentElement;
        while (container && container.tagName !== 'UL' && container.tagName !== 'DIV') {
            container = container.parentElement;
        }

        if (container && !document.getElementById('gmas-vault-header')) {
            const header = document.createElement('div');
            header.id = 'gmas-vault-header';
            header.innerHTML = `
                <div class="gmas-badge">🛡️ Vault Active • ${vaultEmails.length} Accounts Saved</div>
                <input type="text" id="gmas-search-input" placeholder="🔍 Quick search accounts...">
            `;
            container.insertBefore(header, container.firstChild);

            const listContainer = document.createElement('div');
            listContainer.id = 'gmas-account-list';
            container.insertBefore(listContainer, header.nextSibling);

            // Render accounts
            const renderList = (filterText = '') => {
                listContainer.innerHTML = '';
                const filtered = Object.values(vaultAccounts).filter(acc =>
                    acc.email.toLowerCase().includes(filterText.toLowerCase()) ||
                    acc.name.toLowerCase().includes(filterText.toLowerCase())
                );

                filtered.forEach(acc => {
                    const row = document.createElement('div');
                    row.className = 'gmas-account-row';

                    let avatarHtml = `<div class="gmas-initials">${acc.email[0].toUpperCase()}</div>`;
                    if (acc.avatarUrl && !acc.avatarUrl.includes('default-avatar')) {
                        avatarHtml = `<img class="gmas-avatar" src="${acc.avatarUrl}" alt="${acc.name}">`;
                    }

                    const statusPill = acc.status === 'vaulted_ready' || acc.status === 'active_in_browser'
                        ? `<div class="gmas-status-pill">⚡ Switch</div>`
                        : '';

                    row.innerHTML = `
                        ${avatarHtml}
                        <div class="gmas-info">
                            <div class="gmas-name">${acc.name || acc.email}</div>
                            <div class="gmas-email">${acc.email}</div>
                        </div>
                        ${statusPill}
                        <div class="gmas-spinner"></div>
                    `;

                    row.addEventListener('click', () => {
                        const spinner = row.querySelector('.gmas-spinner');
                        if (spinner) spinner.style.display = 'block';

                        chrome.runtime.sendMessage({
                            type: 'SWITCH_ACCOUNT',
                            email: acc.email
                        }, (response) => {
                            if (response && response.success) {
                                window.top.location.reload();
                            } else {
                                if (spinner) spinner.style.display = 'none';
                                alert('Failed to switch account.');
                            }
                        });
                    });

                    listContainer.appendChild(row);
                });
            };

            renderList();

            document.getElementById('gmas-search-input').addEventListener('input', (e) => {
                renderList(e.target.value);
            });
        }
    });
}

function hookAddAccount() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a, div[role="link"], li');
        if (target && (target.textContent.toLowerCase().includes('add another account') || target.href?.includes('AddSession'))) {
            chrome.runtime.sendMessage({ type: 'PREPARE_NEW_ACCOUNT_SLOT' });
        }
    });
}

// Run sequence
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        discoverAccounts();
        injectVaultUI();
        hookAddAccount();
    });
} else {
    discoverAccounts();
    injectVaultUI();
    hookAddAccount();
}

// Also hook into mutation observer for dynamically loaded menus
const observer = new MutationObserver(() => {
    discoverAccounts();
    if (isGoogleMenu() && !document.getElementById('gmas-vault-header')) {
        injectVaultUI();
    }
});
observer.observe(document.documentElement, { childList: true, subtree: true });
