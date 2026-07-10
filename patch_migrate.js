const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

// Insert a migration script right after `let transactions = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];`
content = content.replace(
  /let transactions = JSON\.parse\(localStorage\.getItem\('cardbills_transactions'\)\) \|\| \[\];/,
  `let transactions = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
  
  // Migration: Recalculate pending amounts for existing transactions
  transactions.forEach(tx => {
    if (tx.raw) {
      const bill = parseFloat(tx.raw.billTotal) || 0;
      const paid = tx.raw.payments ? tx.raw.payments.reduce((s, p) => s + (parseFloat(p.amount)||0), 0) : 0;
      const debit = tx.raw.debits ? tx.raw.debits.reduce((s, d) => s + (parseFloat(d.amount)||0), 0) : 0;
      
      const pendingAmount = Math.max(0, bill - paid) + Math.max(0, paid - debit);
      
      let stat = 'Pending';
      let statCol = '#f97316';
      if (pendingAmount <= 0) {
        stat = 'Fully Debited';
        statCol = '#10b981';
      }
      
      tx.status = stat;
      tx.statusColor = statCol;
      tx.pending = "?${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}";
      tx.amountPending = "?${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}";
    }
  });
  localStorage.setItem('cardbills_transactions', JSON.stringify(transactions));`
);

fs.writeFileSync('script.js', content);
console.log("Added migration script");
