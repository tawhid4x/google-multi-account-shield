const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// Basic Structural Tests
function runTests() {
    console.log('Running tests...');
    try {
        // Test 1: valid manifest.json
        const manifestPath = path.join(ROOT_DIR, 'manifest.json');
        assert.ok(fs.existsSync(manifestPath), 'manifest.json does not exist');

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        assert.strictEqual(manifest.manifest_version, 3);
        assert.ok(manifest.permissions.includes('cookies'));
        assert.ok(manifest.permissions.includes('storage'));
        console.log('✓ Valid manifest.json');

        // Test 2: required source files
        const files = [
            'src/shared/constants.js',
            'src/shared/storage-manager.js',
            'src/shared/logger.js',
            'src/background/service-worker.js',
            'src/background/cookie-vault.js',
            'src/background/session-rotator.js',
            'src/background/account-detector.js',
            'src/content/signout-shield.js',
            'src/content/signout-shield.css',
            'src/content/account-menu-injector.js',
            'src/content/account-menu-injector.css',
            'src/popup/popup.html',
            'src/popup/popup.js',
            'src/options/options.html',
            'src/options/options.js'
        ];

        files.forEach(file => {
            const filePath = path.join(ROOT_DIR, file);
            assert.ok(fs.existsSync(filePath), `Missing file: ${file}`);
        });
        console.log('✓ Required source files exist');

        // Test 3: generated icons
        const icons = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png', 'icon.svg'];
        icons.forEach(icon => {
            const iconPath = path.join(ROOT_DIR, 'assets', 'icons', icon);
            assert.ok(fs.existsSync(iconPath), `Missing icon: ${icon}`);
        });
        console.log('✓ Generated icons exist');

        console.log('All tests passed successfully.');
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

runTests();
