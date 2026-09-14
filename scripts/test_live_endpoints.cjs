const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== TESTING LIVE DEV SERVER ENDPOINTS ===\n');

  // Test 1: Manufacturing Assessment tool route
  try {
    const res1 = await get('http://localhost:8080/tools/manufacturing-assessment');
    console.log('1. /tools/manufacturing-assessment: HTTP', res1.status);
    if (res1.status === 200) {
      console.log('   ✓ Manufacturing Assessment tool page rendered 200 OK!');
      const hasTitle = res1.body.includes('Manufacturing Assessment') || res1.body.includes('Maturity');
      console.log('   ✓ Content contains expected terms:', hasTitle);
    } else {
      console.log('   ✗ Unexpected status:', res1.status);
    }
  } catch (err) {
    console.log('   ✗ Request failed:', err.message);
  }

  // Test 2: Tools index page lists all 16 tools
  try {
    const res2 = await get('http://localhost:8080/tools');
    console.log('\n2. /tools index page: HTTP', res2.status);
    const hasMfg = res2.body.includes('manufacturing-assessment');
    console.log('   ✓ /tools lists manufacturing-assessment link:', hasMfg);
  } catch (err) {
    console.log('   ✗ Request failed:', err.message);
  }

  // Test 3: Search page
  try {
    const res3 = await get('http://localhost:8080/search?q=engineer');
    console.log('\n3. /search?q=engineer: HTTP', res3.status);
    const hasJob = res3.body.includes('/careers/ai-engineer') || res3.body.includes('AI Engineer');
    console.log('   ✓ Search results include Career opening link:', hasJob);
  } catch (err) {
    console.log('   ✗ Request failed:', err.message);
  }

  // Test 4: Sitemap XML
  try {
    const res4 = await get('http://localhost:8080/sitemap.xml');
    console.log('\n4. /sitemap.xml: HTTP', res4.status);
    const hasMfgSitemap = res4.body.includes('/tools/manufacturing-assessment');
    console.log('   ✓ /sitemap.xml includes /tools/manufacturing-assessment:', hasMfgSitemap);
  } catch (err) {
    console.log('   ✗ Request failed:', err.message);
  }

  console.log('\n=== ENDPOINT TESTS FINISHED ===');
}

run();
