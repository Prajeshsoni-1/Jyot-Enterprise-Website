const fs = require('fs');
const path = require('path');

const publicDir = path.resolve('.output/public');
const htmlPath = path.join(publicDir, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('FAIL: index.html not found!');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
console.log(`PASS: index.html exists (${(html.length / 1024).toFixed(1)} KB)`);

// Check CSS
const cssMatches = [...html.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
console.log('CSS references:', cssMatches);
for (const href of cssMatches) {
  if (href.startsWith('http')) {
    console.log(`External CSS: ${href}`);
    continue;
  }
  const filePath = path.join(publicDir, href.replace(/^\//, ''));
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    console.log(`PASS: Local CSS exists: ${href} (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`FAIL: Missing CSS file: ${href}`);
    process.exit(1);
  }
}

// Check JS
const jsMatches = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
console.log('JS references:', jsMatches);
for (const src of jsMatches) {
  if (src.startsWith('http')) {
    console.log(`External JS: ${src}`);
    continue;
  }
  const filePath = path.join(publicDir, src.replace(/^\//, ''));
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    console.log(`PASS: Local JS exists: ${src} (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`FAIL: Missing JS file: ${src}`);
    process.exit(1);
  }
}

// Check base path / asset prefix
if (html.includes('/src/') || html.includes('./src/') || html.includes('localhost:')) {
  console.error('FAIL: Found dev paths (/src/ or localhost:) in production index.html');
  process.exit(1);
} else {
  console.log('PASS: No dev paths found in production HTML.');
}

// Check htaccess
const htaccessPath = path.join(publicDir, '.htaccess');
if (fs.existsSync(htaccessPath)) {
  console.log('PASS: .htaccess exists in .output/public');
} else {
  console.warn('WARN: .htaccess missing in .output/public');
}
