const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, '.output', 'public');
const zipFile = path.join(rootDir, 'jyotenterprise-live-build.zip');

if (!fs.existsSync(publicDir)) {
  console.error('[package] Error: .output/public directory does not exist. Run npm run build first.');
  process.exit(1);
}

if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

const sourceHtaccess = path.join(rootDir, 'public', '.htaccess');
const destHtaccess = path.join(publicDir, '.htaccess');
if (fs.existsSync(sourceHtaccess)) {
  fs.copyFileSync(sourceHtaccess, destHtaccess);
  console.log('[package] Synced .htaccess into .output/public');
}

console.log('[package] Creating jyotenterprise-live-build.zip with POSIX forward slashes...');

// Using Windows native tar.exe with POSIX paths
execSync(`tar.exe -a -c -f "${zipFile}" * .htaccess`, {
  cwd: publicDir,
  stdio: 'inherit'
});

const stats = fs.statSync(zipFile);
console.log(`[package] Successfully generated ${zipFile} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
