const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// 1. Add nav variables
const navVars = `  const navAllTransactions = document.getElementById('nav-all-transactions');
  const navPortalBalances = document.getElementById('nav-portal-balances');
  const allTransactionsSection = document.getElementById('allTransactionsSection');
  const portalBalancesSection = document.getElementById('portalBalancesSection');`;

js = js.replace(
  /const navAllTransactions = document\.getElementById\('nav-all-transactions'\);\s*const allTransactionsSection = document\.getElementById\('allTransactionsSection'\);/,
  navVars
);

// 2. Add nav event listener
const navLogic = `
  if (navPortalBalances && portalBalancesSection) {
    navPortalBalances.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      navPortalBalances.classList.add('active');
      showSection(portalBalancesSection);
      breadcrumbCurrent.textContent = 'Portal Balances';
      renderPortalBalances();
    });
  }
`;

js = js.replace(
  /navTransactionBills\.addEventListener\('click', \(e\) => {/,
  navLogic + "\n\n  navTransactionBills.addEventListener('click', (e) => {"
);

// 3. Add render logic
const renderLogic = `

  // ==========================================
  // Portal Balances Logic
  // ==========================================
  const portalTotalBalance = document.getElementById('portalTotalBalance');
  const portalTotalTransactions = document.getElementById('portalTotalTransactions');
  const portalActiveCount = document.getElementById('portalActiveCount');
  const portalCardsGrid = document.getElementById('portalCardsGrid');

  const renderPortalBalances = () => {
    if (!portalCardsGrid) return;

    let portalsMap = {};
    let globalTotalBalance = 0;
    let globalTotalTransactions = 0;

    // A list of border colors for the portal cards to make them colorful like the design
    const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#06b6d4', '#f43f5e', '#84cc16'];

    transactions.forEach(tx => {
      if (tx.raw && tx.raw.debits) {
        tx.raw.debits.forEach(d => {
          const portalName = d.portal || 'Unassigned';
          if (!portalsMap[portalName]) {
            portalsMap[portalName] = { balance: 0, txCount: 0 };
          }
          const amt = parseFloat(d.amount) || 0;
          const portalFee = parseFloat(d.charges) || 0;
          const impact = amt - portalFee;
          
          portalsMap[portalName].balance += impact;
          portalsMap[portalName].txCount += 1;
          
          globalTotalBalance += impact;
          globalTotalTransactions += 1;
        });
      }

      if (tx.raw && tx.raw.payments) {
        tx.raw.payments.forEach(p => {
          const portalName = p.portal || 'Unassigned';
          if (!portalsMap[portalName]) {
            portalsMap[portalName] = { balance: 0, txCount: 0 };
          }
          const amt = parseFloat(p.amount) || 0;
          const impact = -amt;

          portalsMap[portalName].balance += impact;
          portalsMap[portalName].txCount += 1;
          
          globalTotalBalance += impact;
          globalTotalTransactions += 1;
        });
      }
    });

    const activePortalsCount = Object.keys(portalsMap).length;

    // Update Summary Metrics
    if (portalTotalBalance) portalTotalBalance.textContent = \`₹\${formatMoney(globalTotalBalance)}\`;
    if (portalTotalTransactions) portalTotalTransactions.textContent = globalTotalTransactions;
    if (portalActiveCount) portalActiveCount.textContent = activePortalsCount;

    // Render Cards
    portalCardsGrid.innerHTML = '';
    
    if (activePortalsCount === 0) {
      portalCardsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 40px;">No portal data available.</div>';
      return;
    }

    Object.keys(portalsMap).sort().forEach((pName, index) => {
      const data = portalsMap[pName];
      const isPositive = data.balance >= 0;
      const amountColor = isPositive ? '#10b981' : '#ef4444';
      const bgHint = isPositive ? '#f0fdf4' : '#fef2f2';
      const changeSign = isPositive ? '+' : '';
      const accentColor = colors[index % colors.length];

      const cardHTML = \`
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; overflow: hidden; display: flex; flex-direction: column;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: \${accentColor};"></div>
          
          <div style="padding: 20px 20px 16px 20px; flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #111827; text-transform: uppercase;">\${pName}</h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="\${accentColor}" stroke-width="2" width="16" height="16" style="opacity: 0.7;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <p style="color: #6b7280; font-size: 0.75rem; margin-bottom: 24px; display: flex; align-items: center; gap: 4px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              \${data.txCount} transactions
            </p>
            
            <div style="background: \${bgHint}; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
              <p style="color: #6b7280; font-size: 0.75rem; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Current Balance
              </p>
              <h3 style="font-size: 1.5rem; font-weight: 700; color: \${amountColor};">
                \${data.balance < 0 ? '-' : ''}₹\${formatMoney(Math.abs(data.balance))}
              </h3>
            </div>
          </div>
          
          <div style="padding: 12px 20px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
            <div>
              <p style="color: #6b7280; font-size: 0.7rem; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Opening
              </p>
              <p style="color: #374151; font-size: 0.85rem; font-weight: 600;">₹0.0K</p>
            </div>
            <div style="text-align: right;">
              <p style="color: #6b7280; font-size: 0.7rem; margin-bottom: 2px;">Change</p>
              <p style="color: \${amountColor}; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                \${changeSign}₹\${(data.balance / 1000).toFixed(1)}K
                \${isPositive ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>'}
              </p>
            </div>
          </div>
        </div>
      \`;
      
      portalCardsGrid.innerHTML += cardHTML;
    });
  };

  const refreshPortalsBtn = document.getElementById('refreshPortalsBtn');
  if (refreshPortalsBtn) {
    refreshPortalsBtn.addEventListener('click', () => {
      renderPortalBalances();
    });
  }
`;

js = js.replace(
  /const renderAllTransactions = \(\) => {/,
  renderLogic + "\n\n  const renderAllTransactions = () => {"
);

fs.writeFileSync('script.js', js);
console.log("Injected renderPortalBalances logic");
