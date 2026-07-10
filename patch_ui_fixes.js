const fs = require('fs');

// Fix index.html
let html = fs.readFileSync('index.html', 'utf-8');

// Replace ? with ₹
html = html.replace(/\?0\.00/g, '₹0.00');

// Fix table class
html = html.replace(/<table class="table">/g, '<table class="transactions-table">');

// Fix custom-select widths in allTransactionsSection
// We'll replace class="custom-select" with class="custom-select" style="width: auto;" for the ones in the new section
html = html.replace(/id="ledgerCustomerFilter" class="custom-select" style="/, 'id="ledgerCustomerFilter" class="custom-select" style="width: auto; ');
html = html.replace(/id="ledgerPortalFilter" class="custom-select" style="/, 'id="ledgerPortalFilter" class="custom-select" style="width: auto; ');
html = html.replace(/id="ledgerStartDate" class="custom-select" style="/, 'id="ledgerStartDate" class="custom-select" style="width: auto; ');
html = html.replace(/id="ledgerEndDate" class="custom-select" style="/, 'id="ledgerEndDate" class="custom-select" style="width: auto; ');

fs.writeFileSync('index.html', html);
console.log("Fixed index.html");

// Fix script.js
let js = fs.readFileSync('script.js', 'utf-8');

// Replace ? with ₹ in script.js rendering logic
js = js.replace(/`\?\s*\$\{formatMoney/g, '`₹ ${formatMoney');
js = js.replace(/>\?\$?\{formatMoney/g, '>₹${formatMoney');
js = js.replace(/>\+\?\$?\{formatMoney/g, '>+₹${formatMoney');
js = js.replace(/impactSign\}\?\$?\{formatMoney/g, 'impactSign}₹${formatMoney');

fs.writeFileSync('script.js', js);
console.log("Fixed script.js");
