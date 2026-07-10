const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// I need to clean up everything from line 1148 to where the fallback logic ends.
// Let's find the exact string that is currently broken.
const brokenPart = `              type: 'Debit',
              debitAmt: amt,
              creditAmt: null
            });
          }
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

const fixedPart = `              type: 'Debit',
              debitAmt: amt,
              creditAmt: null
            });
          }
        });
      }`;

if (js.includes('impact: -paidAmt,\n            chargesStatus: \'\'\n          });\n        }\n      }')) {
  // Let's do a substring replace to be safe
  const targetRegex = /debitAmt: amt,\n\s*creditAmt: null\n\s*\}\);\n\s*\}\n\s*\}[\s\S]*?impact: -paidAmt,\n\s*chargesStatus: ''\n\s*\}\);\n\s*\}\n\s*\}/;
  if (targetRegex.test(js)) {
    js = js.replace(targetRegex, fixedPart);
    fs.writeFileSync('script.js', js);
    console.log("Fixed syntax error");
  } else {
    console.log("Regex didn't match the broken part");
  }
} else {
  console.log("Couldn't find the end of the broken part");
}
