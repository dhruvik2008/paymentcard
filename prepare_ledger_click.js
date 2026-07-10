const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// Step 1: Change transactions.forEach(tx => { to transactions.forEach((tx, originalTxIndex) => { in renderAllTransactions
const renderAllTxRegex = /const renderAllTransactions = \(\) => \{[\s\S]*?transactions\.forEach\(tx => \{/;
if (renderAllTxRegex.test(js)) {
  js = js.replace(/transactions\.forEach\(tx => \{/, 'transactions.forEach((tx, originalTxIndex) => {');
  console.log("Updated loop signature");
} else {
  // It might already be replaced if we run this twice, or there's a mismatch
  console.log("Could not find transactions.forEach in renderAllTransactions");
}

// Step 2: Add originalTxIndex to allTx.push calls
js = js.replace(/chargesStatus: (.*?)\n\s*\}\);/g, "chargesStatus: $1,\n            originalTxIndex: originalTxIndex\n          });");
// Wait, the regex might replace in other functions too. Let's be safer.
