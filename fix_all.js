const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const safeFallback = `
      if (!hasDebits && !hasPayments) {
        // Bulletproof fallback
        const getNum = (val) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
          return 0;
        };
        const billAmt = tx.raw ? parseFloat(tx.raw.billTotal || 0) : getNum(tx.bill);
        const paidAmt = getNum(tx.paid);
        
        if (billAmt > 0) {
`;

// Replace all occurrences of the buggy part globally
const buggyPartRegex = /if \(!hasDebits && !hasPayments\) \{[\s\S]*?if \(billAmt > 0\) \{/g;
js = js.replace(buggyPartRegex, safeFallback);

fs.writeFileSync('script.js', js);
console.log("Replaced all occurrences of the buggy logic");
