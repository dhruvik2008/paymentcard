const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const replacement = `  const portalBalancesSection = document.getElementById('portalBalancesSection');\n  const transactionsSubmenu = document.getElementById('transactionsSubmenu');`;
js = js.replace(/\/\* Removed duplicate const portalBalancesSection \*\/\s*\n\s*const transactionsSubmenu = document\.getElementById\('transactionsSubmenu'\);/, replacement);

fs.writeFileSync('script.js', js);
console.log("Restored portalBalancesSection");
