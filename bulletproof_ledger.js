const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// I will extract renderAllTransactions and evaluate it with some dummy data to see if it throws
// Instead, let's just make the fallback logic bulletproof against non-strings
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

// Let's replace the buggy part
const buggyPartRegex = /if \(!hasDebits && !hasPayments\) \{[\s\S]*?if \(billAmt > 0\) \{/;

if (buggyPartRegex.test(js)) {
  js = js.replace(buggyPartRegex, safeFallback);
  fs.writeFileSync('script.js', js);
  console.log("Bulletproofed renderAllTransactions fallback logic");
} else {
  console.log("Regex didn't match buggy part");
}
