const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const wipeScript = `
// Temporary script to clear out bad settlement transactions
(function() {
  let txs = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
  const originalLength = txs.length;
  // Remove all settlement entries so the user can start fresh
  txs = txs.filter(tx => !tx.isSettlement);
  
  if (txs.length !== originalLength) {
    localStorage.setItem('cardbills_transactions', JSON.stringify(txs));
    console.log("Cleared old settlements.");
  }
})();
`;

js = wipeScript + '\n' + js;

fs.writeFileSync('script.js', js);
console.log("Injected auto-clear script");
