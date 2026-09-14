const { execSync } = require('child_process');
const path = require('path');

const file1 = path.join(__dirname, '../src/routes/api/downloads.$name.ts');
const file2 = path.join(__dirname, '../src/routes/_authenticated/admin.website.$module.$id.tsx');
const file3 = path.join(__dirname, '../src/routes/downloads.tsx');

execSync(`npx prettier --write "${file1}" "${file2}" "${file3}"`, { stdio: 'inherit' });
console.log('Prettier formatting complete.');
