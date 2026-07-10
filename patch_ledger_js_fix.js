const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

const navVars = `  const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
  const navAllTransactions = document.getElementById('nav-all-transactions');
  const allTransactionsSection = document.getElementById('allTransactionsSection');`;

content = content.replace(
  /const breadcrumbCurrent = document\.getElementById\('breadcrumbCurrent'\);/,
  navVars
);

const navLogic = `
  if (navAllTransactions && allTransactionsSection) {
    navAllTransactions.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      navAllTransactions.classList.add('active');
      showSection(allTransactionsSection);
      breadcrumbCurrent.textContent = 'All Transactions';
      renderAllTransactions();
    });
  }
`;

content = content.replace(
  /navTransactionBills\.addEventListener\('click', \(e\) => {/,
  navLogic + "\n\n  navTransactionBills.addEventListener('click', (e) => {"
);

const renderLogic = `

  // ==========================================
  // All Transactions Ledger Logic
  // ==========================================
  const ledgerListBody = document.getElementById('ledgerListBody');
  const ledgerTotalCredit = document.getElementById('ledgerTotalCredit');
  const ledgerTotalDebit = document.getElementById('ledgerTotalDebit');
  const ledgerCurrentBalance = document.getElementById('ledgerCurrentBalance');
  const ledgerCustomerFilter = document.getElementById('ledgerCustomerFilter');
  const ledgerTypeAll = document.getElementById('ledgerTypeAll');
  const ledgerTypeCredit = document.getElementById('ledgerTypeCredit');
  const ledgerTypeDebit = document.getElementById('ledgerTypeDebit');
  const ledgerPortalFilter = document.getElementById('ledgerPortalFilter');
  const ledgerStartDate = document.getElementById('ledgerStartDate');
  const ledgerEndDate = document.getElementById('ledgerEndDate');
  const ledgerClearBtn = document.getElementById('ledgerClearBtn');

  let activeLedgerType = 'All';

  const formatMoney = (amount) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderAllTransactions = () => {
    if (!ledgerListBody) return;
    let allTx = [];

    const customerSet = new Set();
    const portalSet = new Set();

    transactions.forEach(tx => {
      customerSet.add(tx.customerName);
      const bankInfo = \`\${tx.bank}\`;

      if (tx.raw && tx.raw.debits) {
        tx.raw.debits.forEach(d => {
          if (d.portal) portalSet.add(d.portal);
          const amt = parseFloat(d.amount) || 0;
          const portalFee = parseFloat(d.charges) || 0;
          const customerFee = amt * (parseFloat(d.ratePercent) || 0) / 100;
          const profit = parseFloat(d.profit) || (customerFee - portalFee);
          
          let dateStr = d.date || tx.date;
          allTx.push({
            type: 'Credit',
            dateStr: dateStr,
            timeStr: tx.time,
            timestamp: new Date(\`\${dateStr} \${tx.time}\`).getTime(),
            customer: tx.customerName,
            bank: bankInfo,
            portal: d.portal || 'N/A',
            baseAmount: amt,
            portalFee: portalFee,
            customerFee: customerFee,
            profit: profit,
            impact: amt - portalFee,
            chargesStatus: d.chargesStatus || 'PENDING'
          });
        });
      }

      if (tx.raw && tx.raw.payments) {
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
      }
    });

    if (ledgerCustomerFilter.options.length <= 1) {
      [...customerSet].sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        ledgerCustomerFilter.appendChild(opt);
      });
    }
    if (ledgerPortalFilter.options.length <= 1) {
      [...portalSet].sort().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        ledgerPortalFilter.appendChild(opt);
      });
    }

    allTx.sort((a, b) => a.timestamp - b.timestamp);

    const selCustomer = ledgerCustomerFilter.value;
    const selPortal = ledgerPortalFilter.value;
    const selStart = ledgerStartDate.value ? new Date(ledgerStartDate.value).getTime() : 0;
    const selEnd = ledgerEndDate.value ? new Date(ledgerEndDate.value).getTime() + 86400000 : Infinity;

    let filteredTx = allTx.filter(tx => {
      if (selCustomer && tx.customer !== selCustomer) return false;
      if (activeLedgerType !== 'All' && tx.type !== activeLedgerType) return false;
      if (selPortal && tx.portal !== selPortal) return false;
      if (tx.timestamp < selStart || tx.timestamp >= selEnd) return false;
      return true;
    });

    let currentBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    filteredTx.forEach(tx => {
      currentBalance += tx.impact;
      tx.balance = currentBalance;
      if (tx.impact > 0) totalCredit += tx.impact;
      else totalDebit += Math.abs(tx.impact);
    });

    ledgerTotalCredit.textContent = \`₹ \${formatMoney(totalCredit)}\`;
    ledgerTotalDebit.textContent = \`₹ \${formatMoney(totalDebit)}\`;
    ledgerCurrentBalance.textContent = \`₹ \${formatMoney(currentBalance)}\`;

    filteredTx.reverse();
    ledgerListBody.innerHTML = '';
    if (filteredTx.length === 0) {
      ledgerListBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #6b7280;">No transactions found.</td></tr>';
      return;
    }

    filteredTx.forEach(tx => {
      const tr = document.createElement('tr');
      const isCredit = tx.type === 'Credit';
      const typeBadge = isCredit ? \`<span style="border: 1px solid #bfdbfe; color: #3b82f6; background-color: #eff6ff; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Bill Debit</span>\` 
                                 : \`<span style="border: 1px solid #bfdbfe; color: #3b82f6; background-color: #eff6ff; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Bill Payment</span>\`;
      const title = isCredit ? 'Customer Debit - Card Debit' : 'Bill Payment - Credit Card Bill';
      const desc = isCredit ? \`Customer Debited: ₹\${formatMoney(tx.baseAmount)}\` : '';
      const impactColor = isCredit ? '#10b981' : '#ef4444';
      const impactSign = isCredit ? '+' : '';
      
      let chargesHtml = '';
      if (isCredit) {
        chargesHtml = \`
          <div style="color: #f59e0b; font-weight: 600;">₹\${formatMoney(tx.portalFee)}</div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 2px;">Portal Fee</div>
          <div style="color: #3b82f6; font-weight: 600;">₹\${formatMoney(tx.customerFee)}</div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 4px;">Customer Fee</div>
          <span style="border: 1px solid #fbd38d; color: #f59e0b; padding: 2px 8px; border-radius: 12px; font-size: 0.6rem; font-weight: 600; text-transform: uppercase;">\${tx.chargesStatus}</span>
        \`;
      } else {
        chargesHtml = \`<div style="color: #6b7280; font-size: 0.85rem; padding-top: 10px;">No charges</div>\`;
      }

      tr.innerHTML = \`
        <td style="vertical-align: top; padding: 16px;">
          <div style="color: #111827; font-weight: 500;">\${new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</div>
          <div style="color: #6b7280; font-size: 0.85rem;">\${tx.timeStr}</div>
        </td>
        <td style="vertical-align: top; padding: 16px;">
          <div style="margin-bottom: 6px;">\${typeBadge}</div>
          <div style="color: #111827; font-weight: 500; font-size: 0.95rem;">\${title}</div>
          <div style="color: #6b7280; font-size: 0.85rem;">\${desc}</div>
        </td>
        <td style="vertical-align: top; padding: 16px;">
          <div style="color: #10b981; font-weight: 600; margin-bottom: 4px;">Portal: \${tx.portal}</div>
          <div style="color: #6b7280; font-size: 0.85rem;">Customer: \${tx.customer} &bull; Bank: \${tx.bank}</div>
        </td>
        <td style="vertical-align: top; text-align: right; padding: 16px;">
          <div style="color: \${impactColor}; font-weight: 700; font-size: 1.05rem; margin-bottom: 4px;">\${impactSign}₹\${formatMoney(tx.impact)}</div>
          \${isCredit ? \`<div style="color: #6b7280; font-size: 0.85rem;">Profit: <span style="color: #10b981;">₹\${formatMoney(tx.profit)}</span></div>\` : ''}
        </td>
        <td style="vertical-align: top; text-align: right; padding: 16px;">
          \${chargesHtml}
        </td>
        <td style="vertical-align: top; text-align: right; color: #10b981; font-weight: 700; font-size: 1.05rem; padding: 16px;">
          ₹\${formatMoney(tx.balance)}
        </td>
      \`;
      ledgerListBody.appendChild(tr);
    });
  };

  if (ledgerCustomerFilter) {
    [ledgerCustomerFilter, ledgerPortalFilter, ledgerStartDate, ledgerEndDate].forEach(el => {
      if (el) el.addEventListener('change', renderAllTransactions);
    });

    const setLedgerType = (type) => {
      activeLedgerType = type;
      [ledgerTypeAll, ledgerTypeCredit, ledgerTypeDebit].forEach(btn => {
        btn.style.backgroundColor = '#f9fafb';
        btn.style.color = '#6b7280';
      });
      let activeBtn = type === 'All' ? ledgerTypeAll : (type === 'Credit' ? ledgerTypeCredit : ledgerTypeDebit);
      activeBtn.style.backgroundColor = '#0ea5e9';
      activeBtn.style.color = 'white';
      renderAllTransactions();
    };

    if (ledgerTypeAll) ledgerTypeAll.addEventListener('click', () => setLedgerType('All'));
    if (ledgerTypeCredit) ledgerTypeCredit.addEventListener('click', () => setLedgerType('Credit'));
    if (ledgerTypeDebit) ledgerTypeDebit.addEventListener('click', () => setLedgerType('Debit'));

    if (ledgerClearBtn) {
      ledgerClearBtn.addEventListener('click', () => {
        ledgerCustomerFilter.value = '';
        ledgerPortalFilter.value = '';
        ledgerStartDate.value = '';
        ledgerEndDate.value = '';
        setLedgerType('All');
      });
    }
  }
`;

content = content.replace(
  /const searchInput = document\.getElementById\('transactionSearchInput'\);/,
  renderLogic + "\n\n  const searchInput = document.getElementById('transactionSearchInput');"
);

fs.writeFileSync('script.js', content);
console.log("Injected JS logic successfully");
