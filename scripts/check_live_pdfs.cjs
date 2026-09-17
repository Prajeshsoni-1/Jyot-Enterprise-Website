const https = require('https');

async function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
  });
}

async function run() {
  const pages = ['financial', 'it', 'legal', 'engineering'];
  for (const p of pages) {
    const res = await get(`https://jyotenterprise.in/services/${p}/`);
    console.log(`\n=== PAGE: /services/${p} (Status ${res.status}) ===`);
    const links = [...res.data.matchAll(/href="([^"]+)"/g)]
      .map(m => m[1])
      .filter(l => l.includes('download') || l.endsWith('.pdf'));
    console.log('Links found:', links);

    for (const link of links) {
      const fullUrl = link.startsWith('http') ? link : `https://jyotenterprise.in${link}`;
      const fileRes = await get(fullUrl);
      console.log(`  -> ${link} : Status ${fileRes.status}, Length: ${fileRes.data.length}`);
    }
  }
}

run().catch(console.error);
