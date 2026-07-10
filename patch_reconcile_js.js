const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const newJsLogic = `
  const dailySettlementBtn = document.getElementById('dailySettlementBtn');
  const settlementModal = document.getElementById('settlementModal');
  const closeSettlementModal = document.getElementById('closeSettlementModal');
  const cancelSettlementBtn = document.getElementById('cancelSettlementBtn');
  const confirmSettlementBtn = document.getElementById('confirmSettlementBtn');
  
  const settlementDate = document.getElementById('settlementDate');
  const settlementExpected = document.getElementById('settlementExpected');
  const settlementActual = document.getElementById('settlementActual');
  const settlementNotes = document.getElementById('settlementNotes');
  
  let currentExpectedBalance = 0;

  const hideSettlementModal = () => {
    if (settlementModal) settlementModal.style.display = 'none';
  };

  if (closeSettlementModal) closeSettlementModal.addEventListener('click', hideSettlementModal);
  if (cancelSettlementBtn) cancelSettlementBtn.addEventListener('click', hideSettlementModal);

  if (dailySettlementBtn) {
    dailySettlementBtn.addEventListener('click', () => {
      // Calculate current global balance
      currentExpectedBalance = 0;
      transactions.forEach(tx => {
        if (tx.raw && tx.raw.debits) {
          tx.raw.debits.forEach(d => {
            currentExpectedBalance += (parseFloat(d.amount) || 0) - (parseFloat(d.charges) || 0);
          });
        }
        if (tx.raw && tx.raw.payments) {
          tx.raw.payments.forEach(p => {
            currentExpectedBalance -= (parseFloat(p.amount) || 0);
          });
        }
      });

      // Populate UI
      if (settlementDate) settlementDate.value = new Date().toISOString().split('T')[0];
      if (settlementExpected) settlementExpected.value = currentExpectedBalance.toFixed(2);
      if (settlementActual) {
        settlementActual.value = '';
        settlementActual.focus();
      }
      if (settlementNotes) settlementNotes.value = '';
      
      // Disable confirm button
      if (confirmSettlementBtn) {
        confirmSettlementBtn.disabled = true;
        confirmSettlementBtn.style.backgroundColor = '#e5e7eb';
        confirmSettlementBtn.style.color = '#9ca3af';
        confirmSettlementBtn.style.cursor = 'not-allowed';
      }

      if (settlementModal) settlementModal.style.display = 'flex';
    });
  }
  
  if (settlementActual && confirmSettlementBtn) {
    settlementActual.addEventListener('input', () => {
      if (settlementActual.value.trim() !== '') {
        confirmSettlementBtn.disabled = false;
        confirmSettlementBtn.style.backgroundColor = '#0ea5e9';
        confirmSettlementBtn.style.color = 'white';
        confirmSettlementBtn.style.cursor = 'pointer';
      } else {
        confirmSettlementBtn.disabled = true;
        confirmSettlementBtn.style.backgroundColor = '#e5e7eb';
        confirmSettlementBtn.style.color = '#9ca3af';
        confirmSettlementBtn.style.cursor = 'not-allowed';
      }
    });
  }

  if (confirmSettlementBtn) {
    confirmSettlementBtn.addEventListener('click', () => {
      if (confirmSettlementBtn.disabled) return;
      
      const actualBal = parseFloat(settlementActual.value) || 0;
      const diff = actualBal - currentExpectedBalance;
      
      if (Math.abs(diff) < 0.01) {
        showToast('Balance matched perfectly! No adjustment needed.');
        hideSettlementModal();
        return;
      }
      
      // We have a difference, create a reconciliation transaction
      let sDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      if (settlementDate && settlementDate.value) {
        const d = new Date(settlementDate.value);
        if (!isNaN(d)) {
          sDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        }
      }

      let settlementDebits = [];
      let settlementPayments = [];

      if (diff > 0) {
        // Actual is higher -> We gained money -> Record as an inflow (Debit)
        settlementDebits.push({
          id: 'recon_' + Date.now() + Math.random().toString(36).substr(2, 5),
          amount: diff.toFixed(2),
          charges: '0',
          portal: 'System Reconciliation',
          feePercentage: 0
        });
      } else {
        // Actual is lower -> We lost money -> Record as an outflow (Payment)
        settlementPayments.push({
          id: 'recon_' + Date.now() + Math.random().toString(36).substr(2, 5),
          amount: Math.abs(diff).toFixed(2),
          portal: 'System Reconciliation'
        });
      }
      
      const notes = settlementNotes ? settlementNotes.value.trim() : '';

      const settlementTx = {
        id: 'RECON_' + Date.now() + Math.random().toString(36).substr(2, 9),
        date: sDate,
        customerName: 'System Reconciliation',
        cardBank: 'Adjustment',
        cardLast4: '0000',
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

      transactions.push(settlementTx);
      localStorage.setItem('cardbills_transactions', JSON.stringify(transactions));
      
      hideSettlementModal();
      renderPortalBalances();
      renderAllTransactions();
      renderTransactions();
      
      showToast(\`Reconciliation recorded. Balance adjusted by ₹\${Math.abs(diff).toFixed(2)}.\`);
    });
  }
`;

js = js.replace(
  /const dailySettlementBtn = document\.getElementById\('dailySettlementBtn'\);[\s\S]*?if \(confirmSettlementBtn\) \{[\s\S]*?showToast.*?;\s*\}\);\s*\}/,
  newJsLogic
);

fs.writeFileSync('script.js', js);
console.log("Injected updated JS logic");
