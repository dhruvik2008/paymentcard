const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

// Replace profitTotal calculation
content = content.replace(
  /profitTotal = tx\.raw\.debits\.reduce\(\(sum, d\) => \{[\s\S]*?return sum \+ \(pAmount - cAmount\);\s*\}, 0\);/,
  `profitTotal = tx.raw.debits.reduce((sum, d) => {
        let dAmt = parseFloat(d.amount) || 0;
        let dChg = parseFloat(d.charges) || 0;
        let dPaid = parseFloat(d.paidAmount) || 0;
        let dPortalRate = parseFloat(d.portalPercent) || 0;
        
        let profit = 0;
        if (dPaid > 0) {
          profit = dPaid - (dAmt - dChg);
        } else {
          let portalCharges = (dAmt * dPortalRate) / 100;
          profit = dChg - portalCharges;
        }
        return sum + profit;
      }, 0);`
);

// Replace dProf and dMargin calculation
content = content.replace(
  /let dProf = dPaid - dChg;\s*let dRate = \(dChg \/ dAmt\) \* 100;\s*let dMargin = dPaid > 0 \? \(dProf \/ dPaid\) \* 100 : 0;/,
  `let dRate = (dChg / dAmt) * 100;
        let dPortalRate = parseFloat(d.portalPercent) || 0;
        let dProf = 0;
        let dMargin = 0;
        
        if (dPaid > 0) {
          dProf = dPaid - (dAmt - dChg);
          dMargin = (dProf / dAmt) * 100;
        } else {
          let portalCharges = (dAmt * dPortalRate) / 100;
          dProf = dChg - portalCharges;
          dMargin = dRate - dPortalRate;
        }`
);

fs.writeFileSync('script.js', content);
console.log("Updated profit calculation in script.js");
