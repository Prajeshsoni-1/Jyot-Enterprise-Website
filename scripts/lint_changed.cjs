const { execSync } = require('child_process');
const path = require('path');

const files = [
  'src/routes/api/downloads.$name.ts',
  'src/routes/_authenticated/admin.website.$module.$id.tsx',
  'src/routes/downloads.tsx',
  'src/components/site/DownloadCenter.tsx',
  'src/components/admin/PdfUploadButton.tsx',
  'src/data/downloads.ts'
].map(f => `"${path.join(__dirname, '..', f)}"`).join(' ');

try {
  execSync(`npx eslint ${files}`, { stdio: 'inherit' });
  console.log('ESLint passed with 0 errors on all modified files!');
} catch (e) {
  process.exit(1);
}
