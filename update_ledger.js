const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const fallbackLogic = `
      const hasDebits = tx.raw && tx.raw.debits && tx.raw.debits.length > 0;
      const hasPayments = tx.raw && tx.raw.payments && tx.raw.payments.length > 0;
      
      if (!hasDebits && !hasPayments) {
        // Fallback for simple/old transactions without specific portal entries
        const billAmt = tx.raw ? parseFloat(tx.raw.billTotal || 0) : (tx.bill ? parseFloat(tx.bill.replace(/[^0-9.-]+/g, '')) : 0);
        const paidAmt = tx.paid ? parseFloat(tx.paid.replace(/[^0-9.-]+/g, '')) : 0;
        
        if (billAmt > 0) {
          allTx.push({
            type: 'Credit',
            dateStr: tx.date,
            timeStr: tx.time,
            timestamp: new Date(\`\${tx.date} \${tx.time}\`).getTime(),
            customer: tx.customerName,
            bank: bankInfo,
            portal: 'General',
            baseAmount: billAmt,
            portalFee: 0,
            customerFee: 0,
            profit: 0,
            impact: billAmt,
            chargesStatus: ''
          });
        }
        
        if (paidAmt > 0) {
          allTx.push({
            type: 'Debit',
            dateStr: tx.date,
            timeStr: tx.time,
            timestamp: new Date(\`\${tx.date} \${tx.time}\`).getTime() + 1000,
            customer: tx.customerName,
            bank: bankInfo,
            portal: 'General',
            baseAmount: paidAmt,
            portalFee: 0,
            customerFee: 0,
            profit: 0,
            impact: -paidAmt,
            chargesStatus: ''
          });
        }
      }
`;

// Insert the fallbackLogic right after the block for tx.raw.payments
// Find this block:
const targetStr = `      if (tx.raw && tx.raw.payments) {
        tx.raw.payments.forEach(p => {
          if (p.portal) portalSet.add(p.portal);
          const amt = parseFloat(p.amount) || 0;
          let dateStr = p.date || tx.date;
          allTx.push({
            type: 'Debit',
            dateStr: dateStr,
            timeStr: tx.time,
            timestamp: new Date(\`\${dateStr} \${tx.time}\`).getTime(),
            customer: tx.customerName,
            bank: bankInfo,
            portal: p.portal || 'N/A',
            baseAmount: amt,
            portalFee: 0,
            customerFee: 0,
            profit: 0,
            impact: -amt,
            chargesStatus: ''
          });
        });
      }`;

if (js.includes('impact: -amt,\n            chargesStatus: \'\'\n          });\n        });\n      }')) {
  // It's there. Let's do a more robust replace using regex to append the fallback logic
  const replaceRegex = /(if \(tx\.raw && tx\.raw\.payments\) \{[\s\S]*?\}\s*\n\s*\})/;
  if (replaceRegex.test(js)) {
    js = js.replace(replaceRegex, `$1\n${fallbackLogic}`);
    fs.writeFileSync('script.js', js);
    console.log("Added fallback logic to renderAllTransactions");
  } else {
    console.log("Regex match failed");
  }
} else {
  console.log("Target string not found");
}
