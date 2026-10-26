# Security Architecture & Cookie Isolation

## Overview
Google Multi-Account Shield handles sensitive authentication cookies to bypass Google's 10-account limit and prevent accidental mass sign-outs. Security and isolation are paramount.

## Architecture
1. **Cookie Vault**: All intercepted session cookies (`SID`, `HSID`, `__Secure-1PSID`, etc.) are encrypted by the browser natively when stored in `chrome.storage.local`.
2. **Isolation**: When an account is inactive, its cookies are physically removed from the browser's active cookie jar and safely parked in the vault. This guarantees no cross-session token spillage.
3. **No Network Access**: The extension does not ask for network permissions beyond interacting with `.google.com` to swap states. There is no code path that can exfiltrate tokens.
4. **Content Security Policy (CSP)**: The extension strictly adheres to Manifest V3 CSP, disallowing any inline scripts or remote code execution.

## Reporting a Vulnerability
If you discover a security vulnerability, please do NOT open a public issue. Reach out to the maintainers directly.
