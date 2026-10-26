import { StorageManager } from '../shared/storage-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
    let vault = await StorageManager.getVault();

    const renderTable = (filter = '') => {
        const tbody = document.getElementById('accounts-body');
        tbody.innerHTML = '';

        let readyCount = 0;
        const accounts = Object.values(vault);

        const filtered = accounts.filter(acc =>
            acc.email.toLowerCase().includes(filter.toLowerCase()) ||
            (acc.name && acc.name.toLowerCase().includes(filter.toLowerCase()))
        );

        document.getElementById('total-count').textContent = accounts.length;

        filtered.forEach(acc => {
            if (acc.status === 'vaulted_ready' || acc.status === 'active_in_browser') {
                readyCount++;
            }

            const tr = document.createElement('tr');

            let avatarHtml = `<div class="avatar">${acc.email[0].toUpperCase()}</div>`;
            if (acc.avatarUrl && !acc.avatarUrl.includes('default-avatar')) {
                avatarHtml = `<div class="avatar"><img src="${acc.avatarUrl}" alt="Avatar"></div>`;
            }

            const statusText = acc.status === 'vaulted_ready' ? 'Ready in Vault' :
                               acc.status === 'active_in_browser' ? 'Active' : 'Needs Login';

            const statusClass = (acc.status === 'vaulted_ready' || acc.status === 'active_in_browser') ? 'status-ready' : '';

            tr.innerHTML = `
                <td>
                    <div class="account-cell">
                        ${avatarHtml}
                        <div class="account-info">
                            <strong>${acc.name || acc.email}</strong>
                            <span>${acc.email}</span>
                        </div>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${new Date(acc.lastActive).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn" data-email="${acc.email}">Switch</button>
                    <button class="action-btn delete" data-email="${acc.email}">Remove</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('ready-count').textContent = readyCount;
    };

    renderTable();

    document.getElementById('search-accounts').addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    document.getElementById('accounts-body').addEventListener('click', async (e) => {
        const email = e.target.getAttribute('data-email');
        if (!email) return;

        if (e.target.classList.contains('delete')) {
            if (confirm(`Remove ${email} from the Vault? This will delete saved sessions.`)) {
                delete vault[email];
                await StorageManager.saveVault(vault);
                renderTable();
            }
        } else if (e.target.textContent === 'Switch') {
            chrome.runtime.sendMessage({ type: 'SWITCH_ACCOUNT', email }, () => {
                chrome.tabs.create({ url: 'https://myaccount.google.com/' });
            });
        }
    });

    document.getElementById('btn-export').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vault));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "google_account_shield_backup.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
});
