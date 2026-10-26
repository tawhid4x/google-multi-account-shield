// Core Engine 1: Sign Out Shield
console.log('[Google Account Shield] Signout Shield injected.');

let shieldEnabled = true;

// Initialize settings
chrome.storage.local.get(['gmas_settings'], (result) => {
    const settings = result.gmas_settings || { shieldEnabled: true };
    shieldEnabled = settings.shieldEnabled;
    applyShieldState();
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.gmas_settings) {
        shieldEnabled = changes.gmas_settings.newValue.shieldEnabled;
        applyShieldState();
    }
});

function applyShieldState() {
    if (shieldEnabled) {
        document.documentElement.setAttribute('data-gmas-hide-signout', 'true');
        scanForSignOutButtons();
    } else {
        document.documentElement.removeAttribute('data-gmas-hide-signout');
        const hiddenEls = document.querySelectorAll('[data-gmas-signout-hidden="true"]');
        hiddenEls.forEach(el => el.removeAttribute('data-gmas-signout-hidden'));
    }
}

const SIGN_OUT_STRINGS = [
    "sign out of all accounts", "sign out", "log out", "sign out of all",
    "সব অ্যাকাউন্ট থেকে সাইন-আউট করুন", "সাইন-আউট করুন", "সাইন আউট"
];

function isSignOutElement(el) {
    const text = (el.textContent || '').trim().toLowerCase();
    const aria = (el.getAttribute('aria-label') || '').trim().toLowerCase();

    // Safety whitelist
    if (aria.includes('google account:') || text.includes('add another account') || text.includes('add account')) {
        return false;
    }

    if (SIGN_OUT_STRINGS.some(s => text.includes(s) || aria.includes(s))) {
        return true;
    }

    // SVG heuristic (door arrow)
    const svg = el.querySelector('svg path');
    if (svg) {
        const path = svg.getAttribute('d');
        if (path && path.includes('M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5z')) {
            return true;
        }
    }

    return false;
}

function scanForSignOutButtons() {
    if (!shieldEnabled) return;

    // Target links, buttons, and menu items inside the account list area
    const candidates = document.querySelectorAll('a, button, [role="button"], [role="menuitem"], [role="listitem"]');
    candidates.forEach(el => {
        if (isSignOutElement(el)) {
            // Traverse up to find the immediate row container (usually a div or li)
            let parent = el;
            for(let i=0; i<3; i++) {
                if (parent.parentElement && parent.parentElement.tagName !== 'BODY') {
                    parent = parent.parentElement;
                }
            }
            parent.setAttribute('data-gmas-signout-hidden', 'true');
        }
    });
}

// Throttle mutation observer
let timeout;
const observer = new MutationObserver(() => {
    if (!shieldEnabled) return;
    clearTimeout(timeout);
    timeout = setTimeout(scanForSignOutButtons, 50);
});

observer.observe(document.documentElement, { childList: true, subtree: true });

// Capture phase click firewall
window.addEventListener('click', (e) => {
    if (!shieldEnabled) return;

    const target = e.target.closest('[data-gmas-signout-hidden="true"], a[href*="/Logout"]');
    if (target) {
        e.preventDefault();
        e.stopImmediatePropagation();
        console.log('[Google Account Shield] Blocked click on Sign Out button.');
    }
}, true);

// Initial application
applyShieldState();
