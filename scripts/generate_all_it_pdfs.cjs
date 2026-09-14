const { execSync } = require('child_process');
const path = require('path');

const scripts = [
  'generate_capability_brochure_v2.cjs',
  'generate_readiness_checklist.cjs',
  'generate_how_we_ship_software.cjs',
  'generate_it_faqs.cjs'
];

console.log('==================================================');
console.log('Generating all 4 official Jyot Enterprise IT PDFs');
console.log('==================================================');

for (const s of scripts) {
  const fullPath = path.join(__dirname, s);
  console.log(`\nExecuting: ${s}...`);
  execSync(`node "${fullPath}"`, { stdio: 'inherit' });
}

console.log('\nAll 4 client-facing IT PDFs built and synchronized successfully!');
