const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

console.log('Validating extension structure and contents...');
let hasErrors = false;

// Validate manifest.json
try {
  const manifestPath = path.join(ROOT_DIR, 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  console.log('✓ manifest.json is valid JSON.');

  // Validate files referenced in manifest
  const filesToCheck = [];
  if (manifest.background && manifest.background.service_worker) {
    filesToCheck.push(manifest.background.service_worker);
  }

  if (manifest.content_scripts) {
    manifest.content_scripts.forEach(script => {
      if (script.js) filesToCheck.push(...script.js);
      if (script.css) filesToCheck.push(...script.css);
    });
  }

  if (manifest.action && manifest.action.default_popup) {
    filesToCheck.push(manifest.action.default_popup);
  }

  if (manifest.options_page) {
    filesToCheck.push(manifest.options_page);
  }

  if (manifest.icons) {
    Object.values(manifest.icons).forEach(icon => filesToCheck.push(icon));
  }

  filesToCheck.forEach(file => {
    const fullPath = path.join(ROOT_DIR, file);
    if (fs.existsSync(fullPath)) {
      console.log(`✓ Referenced file exists: ${file}`);
    } else {
      console.error(`✗ Missing referenced file: ${file}`);
      hasErrors = true;
    }
  });

} catch (err) {
  console.error(`✗ manifest.json error: ${err.message}`);
  hasErrors = true;
}

// Validate JS syntax using node --check
function checkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      try {
        execSync(`node --check "${fullPath}"`);
        console.log(`✓ JS Syntax OK: ${path.relative(ROOT_DIR, fullPath)}`);
      } catch (err) {
        console.error(`✗ JS Syntax Error in ${path.relative(ROOT_DIR, fullPath)}`);
        hasErrors = true;
      }
    }
  });
}

['src', 'scripts', 'tests'].forEach(dir => checkDir(path.join(ROOT_DIR, dir)));

// Check Icon headers
const ICONS_DIR = path.join(ROOT_DIR, 'assets', 'icons');
[16, 32, 48, 128].forEach(size => {
  const iconPath = path.join(ICONS_DIR, `icon${size}.png`);
  if (fs.existsSync(iconPath)) {
    const header = Buffer.alloc(8);
    const fd = fs.openSync(iconPath, 'r');
    fs.readSync(fd, header, 0, 8, 0);
    fs.closeSync(fd);
    const expected = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (header.equals(expected)) {
      console.log(`✓ Valid PNG header: icon${size}.png`);
    } else {
      console.error(`✗ Invalid PNG header: icon${size}.png`);
      hasErrors = true;
    }
  }
});


if (hasErrors) {
  console.error('Validation failed with errors.');
  process.exit(1);
} else {
  console.log('Validation passed perfectly!');
}
