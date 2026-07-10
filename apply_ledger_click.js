const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// 1. Update loop to include originalTxIndex
js = js.replace(/transactions\.forEach\(tx => \{\n\s*if \(!tx\) return;\n\s*\/\/ Hide settlement entries from the ledger view/g, "transactions.forEach((tx, originalTxIndex) => {\n      if (!tx) return;\n      // Hide settlement entries from the ledger view");

// 2. Add originalTxIndex to the pushed objects
js = js.replace(/chargesStatus: (.*?)\n\s*\}\);/g, "chargesStatus: $1,\n            originalTxIndex: originalTxIndex\n          });");

// 3. Add onclick to tr
const trStr = "const tr = document.createElement('tr');\n      const isCredit = tx.type === 'Credit';";
const trReplacement = `const tr = document.createElement('tr');
      if (typeof tx.originalTxIndex !== 'undefined') {
        tr.style.cursor = 'pointer';
        tr.style.transition = 'background-color 0.2s';
        tr.onmouseover = () => tr.style.backgroundColor = '#f1f5f9';
        tr.onmouseout = () => tr.style.backgroundColor = '';
        tr.onclick = () => { if (typeof actionEdit === 'function') { document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); document.getElementById('nav-transactions').classList.add('active'); showSection(document.getElementById('transactionsSection')); actionEdit(tx.originalTxIndex); } };
      }
      const isCredit = tx.type === 'Credit';`;

js = js.replace(trStr, trReplacement);

fs.writeFileSync('script.js', js);
console.log("Updated ledger click to edit");
