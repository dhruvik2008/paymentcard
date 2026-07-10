const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const settlementLogic = `
  // ==========================================
  // Toast & Settlement Logic
  // ==========================================
  const toastContainer = document.getElementById('toastContainer');
  
  const showToast = (message, type = 'success') => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    const color = type === 'success' ? '#10b981' : '#ef4444';
    const bgColor = type === 'success' ? '#ecfdf5' : '#fef2f2';
    
    toast.style.background = 'white';
    toast.style.borderLeft = \`4px solid \${color}\`;
    toast.style.padding = '16px 24px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '12px';
    toast.style.minWidth = '250px';
    toast.style.animation = 'slideIn 0.3s ease-out forwards';
    toast.style.transition = 'all 0.3s ease';
    
    // Simple keyframes inject for toast
    if (!document.getElementById('toastStyles')) {
      const style = document.createElement('style');
      style.id = 'toastStyles';
      style.textContent = \`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      \`;
      document.head.appendChild(style);
    }

    const icon = type === 'success' 
      ? \`<svg viewBox="0 0 24 24" fill="none" stroke="\${color}" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>\`
      : \`<svg viewBox="0 0 24 24" fill="none" stroke="\${color}" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>\`;

    toast.innerHTML = \`
      \${icon}
      <div style="flex: 1;">
        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #111827;">\${type === 'success' ? 'Success' : 'Notice'}</h4>
        <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #6b7280;">\${message}</p>
      </div>
    \`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const refreshPortalsBtn = document.getElementById('refreshPortalsBtn');
  if (refreshPortalsBtn) {
    refreshPortalsBtn.addEventListener('click', () => {
      const icon = refreshPortalsBtn.querySelector('svg');
      if (icon) icon.classList.add('spin-icon');
      
      transactions = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
      renderPortalBalances();
      renderAllTransactions();
      
      setTimeout(() => {
        if (icon) icon.classList.remove('spin-icon');
        showToast('Portal balances updated with latest transactions.');
      }, 800);
    });
  }

  const dailySettlementBtn = document.getElementById('dailySettlementBtn');
  const settlementModal = document.getElementById('settlementModal');
  const closeSettlementModal = document.getElementById('closeSettlementModal');
  const cancelSettlementBtn = document.getElementById('cancelSettlementBtn');
  const confirmSettlementBtn = document.getElementById('confirmSettlementBtn');
  const settlementModalBody = document.getElementById('settlementModalBody');
  
  let settlementPortalsMap = {};

  const hideSettlementModal = () => {
    if (settlementModal) settlementModal.style.display = 'none';
  };

  if (closeSettlementModal) closeSettlementModal.addEventListener('click', hideSettlementModal);
  if (cancelSettlementBtn) cancelSettlementBtn.addEventListener('click', hideSettlementModal);

  if (dailySettlementBtn) {
    dailySettlementBtn.addEventListener('click', () => {
      settlementPortalsMap = {};
      
      // Calculate current balances
      transactions.forEach(tx => {
        if (tx.raw && tx.raw.debits) {
          tx.raw.debits.forEach(d => {
            const pName = d.portal || 'Unassigned';
            if (!settlementPortalsMap[pName]) settlementPortalsMap[pName] = 0;
            const amt = parseFloat(d.amount) || 0;
            const fee = parseFloat(d.charges) || 0;
            settlementPortalsMap[pName] += (amt - fee);
          });
        }
        if (tx.raw && tx.raw.payments) {
          tx.raw.payments.forEach(p => {
            const pName = p.portal || 'Unassigned';
            if (!settlementPortalsMap[pName]) settlementPortalsMap[pName] = 0;
            settlementPortalsMap[pName] -= (parseFloat(p.amount) || 0);
          });
        }
      });

      // Filter non-zero portals
      const nonZeroPortals = Object.keys(settlementPortalsMap).filter(p => Math.abs(settlementPortalsMap[p]) > 0.01);
      
      if (nonZeroPortals.length === 0) {
        showToast('All portals are already settled (Balance is ₹0).', 'notice');
        return;
      }

      let html = \`
        <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 24px;">The following portals have pending balances. Confirming will create settlement entries to zero out these balances.</p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
      \`;

      nonZeroPortals.forEach(pName => {
        const bal = settlementPortalsMap[pName];
        const isPositive = bal > 0;
        const color = isPositive ? '#10b981' : '#ef4444';
        const actionText = isPositive ? 'Portal pays you' : 'You pay portal';
        
        html += \`
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
            <div>
              <h4 style="margin: 0 0 4px 0; font-size: 1rem; color: #111827;">\${pName}</h4>
              <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">Action: \${actionText}</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: \${color};">\${bal < 0 ? '-' : ''}₹\${formatMoney(Math.abs(bal))}</h3>
              <p style="margin: 0; font-size: 0.7rem; color: #9ca3af;">Will settle to ₹0.00</p>
            </div>
          </div>
        \`;
      });

      html += \`</div>\`;
      
      if (settlementModalBody) {
        settlementModalBody.innerHTML = html;
        settlementModal.style.display = 'flex';
      }
    });
  }

  if (confirmSettlementBtn) {
    confirmSettlementBtn.addEventListener('click', () => {
      const nonZeroPortals = Object.keys(settlementPortalsMap).filter(p => Math.abs(settlementPortalsMap[p]) > 0.01);
      if (nonZeroPortals.length === 0) {
        hideSettlementModal();
        return;
      }

      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      
      // Create a settlement transaction bill for each portal to keep things clean
      nonZeroPortals.forEach(pName => {
        const bal = settlementPortalsMap[pName];
        
        // If balance is positive (Portal owes you money):
        // To zero it out, we must simulate a "Payment" (money goes out of portal).
        // Wait, if portal owes me, settlement means portal gives me money.
        // My balance goes down to 0, which means impact is negative.
        // An impact of negative is achieved by adding a Payment on this portal.
        
        // If balance is negative (I owe portal money):
        // Settlement means I pay the portal. Portal balance goes up to 0 (positive impact).
        // Positive impact is achieved by a Debit with 0 fees.

        let settlementDebits = [];
        let settlementPayments = [];

        if (bal > 0) {
          // Add a Payment to reduce balance by bal
          settlementPayments.push({
            id: 'set_' + Date.now() + Math.random().toString(36).substr(2, 5),
            amount: bal.toFixed(2),
            portal: pName
          });
        } else if (bal < 0) {
          // Add a Debit to increase balance by abs(bal)
          settlementDebits.push({
            id: 'set_' + Date.now() + Math.random().toString(36).substr(2, 5),
            amount: Math.abs(bal).toFixed(2),
            charges: '0',
            portal: pName,
            feePercentage: 0
          });
        }

        const settlementTx = {
          id: 'SETTLEMENT_' + Date.now() + Math.random().toString(36).substr(2, 9),
          date: today,
          customerName: 'Settlement Account', // Special name
          cardBank: 'System',
          cardLast4: '0000',
          baseAmount: Math.abs(bal).toFixed(2),
          customerFee: 0,
          portalFee: 0,
          profit: 0,
          status: 'Fully Debited',
          raw: {
            debits: settlementDebits,
            payments: settlementPayments
          },
          isSettlement: true
        };

        transactions.push(settlementTx);
      });

      localStorage.setItem('cardbills_transactions', JSON.stringify(transactions));
      
      hideSettlementModal();
      renderPortalBalances();
      renderAllTransactions();
      renderTransactions();
      
      showToast(\`Successfully settled \${nonZeroPortals.length} portal(s).\`);
    });
  }
`;

// Inject by replacing the original refreshPortalsBtn stub
js = js.replace(
  /const refreshPortalsBtn = document.getElementById\('refreshPortalsBtn'\);[\s\S]*?if \(refreshPortalsBtn\) {[\s\S]*?refreshPortalsBtn.addEventListener\('click', \(\) => {[\s\S]*?renderPortalBalances\(\);[\s\S]*?}\);[\s\S]*?}/m,
  settlementLogic
);

fs.writeFileSync('script.js', js);
console.log("Injected Toast & Settlement JS");
