const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// 1. Change transactions.forEach(tx => { to transactions.forEach((tx, originalTxIndex) => { inside renderAllTransactions
const renderAllTxMatch = js.indexOf('const renderAllTransactions = () => {');
if (renderAllTxMatch !== -1) {
  const loopStart = js.indexOf('transactions.forEach(tx => {', renderAllTxMatch);
  if (loopStart !== -1 && loopStart < renderAllTxMatch + 1500) {
    js = js.substring(0, loopStart) + 'transactions.forEach((tx, originalTxIndex) => {' + js.substring(loopStart + 28);
  }
}

// 2. Add originalTxIndex to allTx.push calls within renderAllTransactions
// We can just find all chargesStatus: ... in this function and add originalTxIndex
// Find the start and end of renderAllTransactions
const startIdx = js.indexOf('const renderAllTransactions = () => {');
const endIdx = js.indexOf('const renderLedgerEntries', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let section = js.substring(startIdx, endIdx);
  section = section.replace(/(chargesStatus: .*?)\n\s*\}\);/g, "$1,\n            originalTxIndex: originalTxIndex\n          });");
  
  // 3. Add tr.onclick logic
  const trMatch = section.indexOf(`const tr = document.createElement('tr');`);
  if (trMatch !== -1) {
    const trLogic = `const tr = document.createElement('tr');
      if (typeof tx.originalTxIndex !== 'undefined') {
        tr.style.cursor = 'pointer';
        tr.style.transition = 'background-color 0.2s';
        tr.onmouseover = () => tr.style.backgroundColor = '#f1f5f9';
        tr.onmouseout = () => tr.style.backgroundColor = '';
        tr.onclick = () => { if (typeof actionEdit === 'function') actionEdit(tx.originalTxIndex); };
      }`;
    section = section.replace(`const tr = document.createElement('tr');`, trLogic);
  }
  
  js = js.substring(0, startIdx) + section + js.substring(endIdx);
  fs.writeFileSync('script.js', js);
  console.log("Added click to edit in Ledger");
} else {
  console.log("Could not find function bounds");
}
