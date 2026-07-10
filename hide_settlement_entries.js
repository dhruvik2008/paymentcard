const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// Update renderTransactions
js = js.replace(/transactions\.forEach\(\(tx, index\) => \{/m, 
`transactions.forEach((tx, index) => {
      // Hide settlement entries from this view
      if (tx.isSettlement) return;`);

// Update renderAllTransactions
js = js.replace(/transactions\.forEach\(tx => \{\s*customerSet\.add\(tx\.customerName\);/m, 
`transactions.forEach(tx => {
      // Hide settlement entries from the ledger view
      if (tx.isSettlement) return;
      customerSet.add(tx.customerName);`);

fs.writeFileSync('script.js', js);
console.log("Updated script.js to hide settlement entries");
