const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const ZIP_NAME = 'google-multi-account-shield-extension.zip';
const ZIP_PATH = path.join(ROOT_DIR, ZIP_NAME);

console.log(`Packaging extension into ${ZIP_NAME}...`);

// Remove existing zip if it exists
if (fs.existsSync(ZIP_PATH)) {
    fs.unlinkSync(ZIP_PATH);
}

// We'll use the zip command available in most linux/mac environments.
// If zip isn't available, we could use a pure JS solution like jszip, but since this is running in github actions/VMs `zip` is usually standard.
try {
    const filesToInclude = [
        'manifest.json',
        'README.md',
        'PRIVACY.md',
        'SECURITY.md',
        'LICENSE',
        'src/',
        'assets/'
    ];

    // Check if these files exist before passing to zip
    const validFiles = filesToInclude.filter(file => fs.existsSync(path.join(ROOT_DIR, file)));

    if (validFiles.length === 0) {
        console.error("No valid files found to zip.");
        process.exit(1);
    }

    const fileArgs = validFiles.map(f => `"${f}"`).join(' ');

    // -r recursive, -q quiet
    execSync(`zip -rq "${ZIP_NAME}" ${fileArgs}`, { cwd: ROOT_DIR });

    console.log(`Successfully created ${ZIP_NAME}`);
} catch (err) {
    console.error(`Error creating zip file: ${err.message}`);
    process.exit(1);
}
