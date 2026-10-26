import { StorageManager } from '../shared/storage-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load Settings
    const settings = await StorageManager.getSettings();
    const toggleShield = document.getElementById('toggle-shield');
    const toggleVault = document.getElementById('toggle-vault');
    const toggleOverflow = document.getElementById('toggle-overflow');

    toggleShield.checked = settings.shieldEnabled;
    toggleVault.checked = settings.vaultEnabled;
    toggleOverflow.checked = settings.overflowProtection;

    // Load Vault Count
    const vault = await StorageManager.getVault();
    document.getElementById('vault-count').textContent = Object.keys(vault).length;

    // Update Status UI
    const updateStatusUI = () => {
        const statusCard = document.getElementById('status-card');
        const statusText = document.getElementById('status-text');
        if (toggleShield.checked && toggleVault.checked) {
            statusCard.style.background = 'rgba(80, 200, 120, 0.1)';
            statusCard.style.borderColor = 'rgba(80, 200, 120, 0.2)';
            statusText.textContent = 'Protected';
            statusText.style.color = '#50c878';
            document.querySelector('.status-indicator').style.background = '#50c878';
            document.querySelector('.status-indicator').style.boxShadow = '0 0 8px #50c878';
        } else {
            statusCard.style.background = 'rgba(244, 180, 0, 0.1)';
            statusCard.style.borderColor = 'rgba(244, 180, 0, 0.2)';
            statusText.textContent = 'Partially Protected';
            statusText.style.color = '#f4b400';
            document.querySelector('.status-indicator').style.background = '#f4b400';
            document.querySelector('.status-indicator').style.boxShadow = '0 0 8px #f4b400';
        }
    };

    updateStatusUI();

    // Event Listeners for settings
    const saveSettings = async () => {
        await StorageManager.saveSettings({
            shieldEnabled: toggleShield.checked,
            vaultEnabled: toggleVault.checked,
            overflowProtection: toggleOverflow.checked
        });
        updateStatusUI();
    };

    toggleShield.addEventListener('change', saveSettings);
    toggleVault.addEventListener('change', saveSettings);
    toggleOverflow.addEventListener('change', saveSettings);

    // Actions
    document.getElementById('btn-add-account').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'PREPARE_NEW_ACCOUNT_SLOT' }, () => {
            chrome.tabs.create({ url: 'https://accounts.google.com/AddSession' });
        });
    });

    document.getElementById('btn-open-options').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
