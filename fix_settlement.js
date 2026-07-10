const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// Fix the settlementTx object creation and use unshift
js = js.replace(/const settlementTx = {[\s\S]*?transactions\.push\(settlementTx\);/m, 
`const settlementTx = {
        id: 'RECON_' + Date.now() + Math.random().toString(36).substr(2, 9),
        date: sDate,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        customerName: 'System Reconciliation',
        customerPhone: '-',
        bank: 'Adjustment',
        cardSuffix: '0000',
        bill: 'System',
        baseAmount: Math.abs(diff).toFixed(2),
        customerFee: 0,
        portalFee: 0,
        profit: 0,
        status: 'Fully Debited',
        notes: notes,
        raw: {
          debits: settlementDebits,
          payments: settlementPayments
        },
        isSettlement: true
      };

      transactions.unshift(settlementTx); // Put at the top of the list`);

fs.writeFileSync('script.js', js);
console.log("Updated settlementTx logic in script.js");
