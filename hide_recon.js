const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const replacement = `
    transactions.forEach(tx => {
      if (tx.raw && tx.raw.debits) {
        tx.raw.debits.forEach(d => {
          const portalName = d.portal || 'Unassigned';
          const amt = parseFloat(d.amount) || 0;
          const portalFee = parseFloat(d.charges) || 0;
          const impact = amt - portalFee;
          
          if (portalName !== 'System Reconciliation') {
            if (!portalsMap[portalName]) {
              portalsMap[portalName] = { balance: 0, txCount: 0 };
            }
            portalsMap[portalName].balance += impact;
            portalsMap[portalName].txCount += 1;
          }
          globalTotalBalance += impact;
          globalTotalTransactions += 1;
        });
      }
      if (tx.raw && tx.raw.payments) {
        tx.raw.payments.forEach(p => {
          const portalName = p.portal || 'Unassigned';
          const amt = parseFloat(p.amount) || 0;
          
          if (portalName !== 'System Reconciliation') {
            if (!portalsMap[portalName]) {
              portalsMap[portalName] = { balance: 0, txCount: 0 };
            }
            portalsMap[portalName].balance -= amt;
            portalsMap[portalName].txCount += 1;
          }
          globalTotalBalance -= amt;
          globalTotalTransactions += 1;
        });
      }
    });
`;

js = js.replace(/transactions\.forEach\(tx => \{[\s\S]*?\}\);\s*\}\);\s*\}\);/m, replacement.trim());

fs.writeFileSync('script.js', js);
console.log("Updated renderPortalBalances to hide System Reconciliation portal");
