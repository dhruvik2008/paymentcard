const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const fixSort = `
    // Sort oldest to newest for balance calculation
    // If times are exactly the same, we preserve their original index to make it stable
    portalImpacts.forEach((impact, i) => impact.originalIndex = i);
    portalImpacts.sort((a, b) => {
      const timeDiff = a.parsedDate - b.parsedDate;
      if (timeDiff !== 0) return timeDiff;
      return a.originalIndex - b.originalIndex; // Stable sort fallback
    });
    
    let currentBal = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    
    portalImpacts.forEach(impact => {
      if (impact.type === 'Credit') {
        currentBal += impact.creditAmt;
        totalCredit += impact.creditAmt;
      } else {
        currentBal -= impact.debitAmt;
        totalDebit += impact.debitAmt;
      }
      impact.runningBalance = currentBal;
    });

    // Update Top Summary Cards
    document.getElementById('portalDetailCredit').textContent = '₹' + formatMoney(totalCredit);
    document.getElementById('portalDetailDebit').textContent = '₹' + formatMoney(totalDebit);
    document.getElementById('portalDetailBalance').textContent = '₹' + formatMoney(currentBal);

    // Sort newest to oldest for rendering (reverse of what we just did)
    portalImpacts.sort((a, b) => {
      const timeDiff = b.parsedDate - a.parsedDate;
      if (timeDiff !== 0) return timeDiff;
      return b.originalIndex - a.originalIndex; // Stable reverse sort
    });
`;

js = js.replace(/\/\/ Sort oldest to newest for balance calculation[\s\S]*?portalImpacts\.sort\(\(a, b\) => b\.parsedDate - a\.parsedDate\);/m, fixSort.trim());

fs.writeFileSync('script.js', js);
console.log("Fixed ledger sorting");
