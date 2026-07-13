
  // ==========================================
  // REPORTS LOGIC (Customer Balances & Net Profit)
  // ==========================================

  // Navigation Setup
  const navReportsGroup = document.getElementById('navReportsGroup');
  const submenuReports = document.getElementById('submenuReports');
  const navCustomerBalances = document.getElementById('navCustomerBalances');
  const navNetProfitReport = document.getElementById('navNetProfitReport');
  
  const customerBalancesSection = document.getElementById('customerBalancesSection');
  const netProfitReportSection = document.getElementById('netProfitReportSection');

  if (navReportsGroup) {
    navReportsGroup.addEventListener('click', (e) => {
      e.preventDefault();
      navReportsGroup.classList.toggle('submenu-open');
      const chevron = navReportsGroup.querySelector('.chevron');
      if (navReportsGroup.classList.contains('submenu-open')) {
        if (chevron) chevron.style.transform = 'rotate(180deg)';
        if (submenuReports) submenuReports.style.display = 'flex';
      } else {
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        if (submenuReports) submenuReports.style.display = 'none';
      }
    });
  }

  const activateReportSection = (sectionId, breadcrumbText, navId) => {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(navId) {
      document.getElementById(navId).classList.add('active');
    }
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'flex';
    document.getElementById('breadcrumbCurrent').textContent = breadcrumbText;
  };

  if (navCustomerBalances) {
    navCustomerBalances.addEventListener('click', (e) => {
      e.preventDefault();
      activateReportSection('customerBalancesSection', 'Customer Balances', 'navCustomerBalances');
      renderCustomerBalancesReport();
    });
  }

  if (navNetProfitReport) {
    navNetProfitReport.addEventListener('click', (e) => {
      e.preventDefault();
      activateReportSection('netProfitReportSection', 'Net Profit Report', 'navNetProfitReport');
      // Set today as default end date if not already set
      const npEndDate = document.getElementById('npEndDate');
      if (npEndDate && !npEndDate.value) {
        npEndDate.value = new Date().toISOString().split('T')[0];
      }
      renderNetProfitReport();
    });
  }


  // --- Customer Balances Logic ---
  const cbSearchInput = document.getElementById('cbSearchInput');
  if (cbSearchInput) cbSearchInput.addEventListener('input', renderCustomerBalancesReport);

  function renderCustomerBalancesReport() {
    const cbGrid = document.getElementById('cbGrid');
    if (!cbGrid) return;
    
    let allCustomers = JSON.parse(localStorage.getItem('cardbills_customers') || '[]');
    let customers = allCustomers;
    const txs = JSON.parse(localStorage.getItem('cardbills_transactions') || '[]');
    const ledger = JSON.parse(localStorage.getItem('cardbills_ledger_entries') || '[]');

    const search = (cbSearchInput.value || '').toLowerCase();
    
    if (search) {
      customers = customers.filter(c => 
        (c.name || '').toLowerCase().includes(search) || 
        (c.phone || '').toLowerCase().includes(search)
      );
    }
    
    document.getElementById('cbTotalCustomersSubtitle').textContent = `${customers.length} total customers`;

    let totalChargesPending = 0;
    let totalLedgerPending = 0;
    let totalBillsPending = 0;

    cbGrid.innerHTML = '';
    
    customers.forEach(c => {
      let chargesRecv = 0;
      let chargesPay = 0;
      let billsRecv = 0;
      let billsPay = 0;
      
      const origCustIndex = allCustomers.findIndex(orig => orig.name === c.name);

      txs.forEach(t => {
        if (!t.raw) return;
        if ((t.customerName || '').toLowerCase() !== c.name.toLowerCase()) return;
        
        billsRecv += parseFloat(t.raw.billTotal) || 0;
        
        if (t.raw.payments) {
          t.raw.payments.forEach(p => {
             billsPay += parseFloat(p.amount) || 0;
          });
        }
        
        if (t.raw.debits) {
          t.raw.debits.forEach(d => {
            let amt = parseFloat(d.amount) || 0;
            let cFee = parseFloat(d.charges) || (amt * (parseFloat(d.ratePercent) || 0) / 100);
            chargesRecv += cFee; 
            
            let status = (d.chargesStatus || '').toLowerCase();
            let dPaid = parseFloat(d.paidAmount) || 0;
            if (status === 'fully paid' || status === 'settled') {
               chargesPay += cFee;
            } else if (dPaid > 0) {
               chargesPay += dPaid;
            }
          });
        }
      });
      
      let ledgerRecv = 0;
      let ledgerPay = 0;
      
      ledger.forEach(l => {
        if ((l.subUser && l.subUser.trim().toLowerCase() === c.name.trim().toLowerCase()) || (l.description && l.description.toLowerCase().includes(c.name.trim().toLowerCase()))) {
          let lAmt = parseFloat(l.amount) || 0;
          const typeLower = l.type?.toLowerCase();
          if (typeLower === 'expense' || typeLower === 'cash given' || typeLower === 'bank transfer sent') {
            ledgerRecv += lAmt;
          } else if (typeLower === 'income' || typeLower === 'cash received' || typeLower === 'bank transfer received') {
            ledgerPay += lAmt;
          }
        }
      });
      
      let currentCharges = chargesRecv - chargesPay;
      let currentBills = billsRecv - billsPay;
      let ledgerNet = ledgerRecv - ledgerPay;

      // Auto-offset negative bills against positive charges
      if (currentBills < 0 && currentCharges > 0) {
         let deduct = Math.min(currentCharges, Math.abs(currentBills));
         currentCharges -= deduct;
         currentBills += deduct;
         chargesPay += deduct;
         billsPay -= deduct;
      }

      // Auto-offset overpayments (negative ledger) against pending charges and bills
      if (ledgerNet < 0) {
        let available = Math.abs(ledgerNet);
        if (currentCharges > 0) {
           let deduct = Math.min(currentCharges, available);
           currentCharges -= deduct;
           available -= deduct;
           chargesPay += deduct;
           ledgerPay -= deduct;
        }
        if (currentBills > 0 && available > 0) {
           let deduct = Math.min(currentBills, available);
           currentBills -= deduct;
           available -= deduct;
           billsPay += deduct;
           ledgerPay -= deduct;
        }
        ledgerNet = -available;
      }

      if (ledgerNet > 0) {
        ledgerRecv = ledgerNet; ledgerPay = 0;
      } else {
        ledgerPay = Math.abs(ledgerNet); ledgerRecv = 0;
      }
      
      const totRecv = chargesRecv + ledgerRecv + billsRecv;
      const totPay = chargesPay + ledgerPay + billsPay;
      const netCollect = totRecv - totPay;

      // Skip fully settled customers
      if (Math.abs(netCollect) < 0.01) return;

      totalChargesPending += currentCharges;
      totalLedgerPending += ledgerNet;
      totalBillsPending += currentBills;

      const initials = (c.name || 'U').substring(0, 2).toUpperCase();
      const card = document.createElement('div');
      card.style.cssText = 'background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f3f4f6; overflow: hidden; display: flex; flex-direction: column;';
      card.innerHTML = `
        <div style="padding: 16px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #dcfce7; color: #166534; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem;">
            ${initials}
          </div>
          <div>
            <div style="font-weight: 700; color: #1e1b4b; font-size: 0.95rem;">${c.name.toUpperCase()}</div>
            <div style="color: #6b7280; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              ${c.phone || 'N/A'}
            </div>
          </div>
        </div>
        <div style="padding: 16px; background: #f9fafb; text-align: center; border-bottom: 1px solid #f3f4f6;">
          <div style="font-size: 0.75rem; color: #166534; font-weight: 600; margin-bottom: 4px;">Collect from Customer</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #16a34a;">₹${netCollect.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div style="padding: 16px; display: flex; border-bottom: 1px solid #f3f4f6;">
          <div style="flex: 1; text-align: center; border-right: 1px solid #f3f4f6;">
            <div style="font-size: 0.75rem; color: #6b7280; font-weight: 500; margin-bottom: 4px;">To Receive</div>
            <div style="font-size: 1rem; font-weight: 600; color: #16a34a;">₹${totRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 0.75rem; color: #6b7280; font-weight: 500; margin-bottom: 4px;">To Pay</div>
            <div style="font-size: 1rem; font-weight: 600; color: #dc2626;">₹${totPay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
        </div>
        <div style="padding: 16px; display: flex; justify-content: space-between; text-align: center; font-size: 0.75rem; border-bottom: 1px solid #f3f4f6;">
          <div>
            <div style="color: #6b7280; font-weight: 500; margin-bottom: 4px;">Charges</div>
            <div style="color: #d97706; font-weight: 600;">₹${chargesRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div style="color: #16a34a; font-weight: 600;">₹${chargesPay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-weight: 500; margin-bottom: 4px;">Ledger</div>
            <div style="color: #0ea5e9; font-weight: 600;">₹${ledgerRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div style="color: #16a34a; font-weight: 600;">₹${ledgerPay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-weight: 500; margin-bottom: 4px;">Bills</div>
            <div style="color: #0ea5e9; font-weight: 600;">₹${billsRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div style="color: #16a34a; font-weight: 600;">₹${billsPay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
        </div>
        <div style="padding: 16px; display: flex; gap: 8px;">
          <button class="btn btn-outline" onclick="openCustomerBalanceView('${c.name}', '${c.phone}')" style="flex: 1; border-radius: 8px; font-size: 0.85rem; padding: 6px; color: #2563eb; background: #eff6ff; border: none; font-weight: 600; cursor: pointer;">View</button>
          <button class="btn btn-outline" onclick="processCustomerSettlement('${c.name}', 'receive')" style="flex: 1; border-radius: 8px; font-size: 0.85rem; padding: 6px; color: #16a34a; background: #f0fdf4; border: none; font-weight: 600; cursor: pointer;">Settle</button>
          <button class="btn btn-outline" onclick="processCustomerSettlement('${c.name}', 'pay')" style="flex: 1; border-radius: 8px; font-size: 0.85rem; padding: 6px; color: #dc2626; background: #fef2f2; border: none; font-weight: 600; cursor: pointer;">Pay</button>
        </div>
      `;
      cbGrid.appendChild(card);
    });

    const totOweUs = totalChargesPending + totalLedgerPending + totalBillsPending;
    document.getElementById('cbChargesPending').textContent = `₹${totalChargesPending.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('cbLedgerPending').textContent = `₹${totalLedgerPending.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('cbBillsPending').textContent = `₹${totalBillsPending.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('cbCustomersOweUs').textContent = `₹${totOweUs.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }
  window.renderCustomerBalancesReport = renderCustomerBalancesReport;

  window.processCustomerSettlement = (customerName, type) => {
    const txs = JSON.parse(localStorage.getItem('cardbills_transactions') || '[]');
    const allCustomers = JSON.parse(localStorage.getItem('cardbills_customers') || '[]');
    const origCustIndex = allCustomers.findIndex(c => c.name === customerName);
    
    if (origCustIndex === -1) return;
    
    let billsRecv = 0;
    let billsPay = 0;
    let chargesRecv = 0;
    let chargesPay = 0;
    let pendingTxs = [];
    
    txs.forEach((t, i) => {
      if (t.raw && (t.customerName || '').toLowerCase() === customerName.toLowerCase()) {
        billsRecv += parseFloat(t.raw.billTotal) || 0;
        let txPay = 0;
        if (t.raw.payments) {
          t.raw.payments.forEach(p => txPay += parseFloat(p.amount) || 0);
        }
        billsPay += txPay;
        
        let txCharge = 0;
        if (t.raw.debits) {
          t.raw.debits.forEach(d => {
             let cFee = parseFloat(d.charges) || ((parseFloat(d.amount) || 0) * (parseFloat(d.ratePercent) || 0) / 100);
             txCharge += cFee;
             let status = (d.chargesStatus || '').toLowerCase();
             let dPaid = parseFloat(d.paidAmount) || 0;
             if (status === 'fully paid' || status === 'settled') {
                chargesPay += cFee;
             } else if (dPaid > 0) {
                chargesPay += dPaid;
             }
          });
        }
        chargesRecv += txCharge;
        
        let oweOnBill = Math.max(0, (parseFloat(t.raw.billTotal) || 0) - txPay);
        if (oweOnBill > 0) {
          pendingTxs.push({index: i, tx: t, owe: oweOnBill});
        }
      }
    });
    
    const ledger = JSON.parse(localStorage.getItem('cardbills_ledger_entries') || '[]');
    let ledgerRecv = 0;
    let ledgerPay = 0;
    ledger.forEach(l => {
      if ((l.subUser && l.subUser.trim().toLowerCase() === customerName.trim().toLowerCase()) || (l.description && l.description.toLowerCase().includes(customerName.trim().toLowerCase()))) {
        let lAmt = parseFloat(l.amount) || 0;
        const typeLower = l.type?.toLowerCase();
        if (typeLower === 'expense' || typeLower === 'cash given' || typeLower === 'bank transfer sent') ledgerRecv += lAmt;
        else if (typeLower === 'income' || typeLower === 'cash received' || typeLower === 'bank transfer received') ledgerPay += lAmt;
      }
    });
    
    let ledgerNet = ledgerRecv - ledgerPay;
    if (ledgerNet > 0) { ledgerRecv = ledgerNet; ledgerPay = 0; }
    else { ledgerPay = Math.abs(ledgerNet); ledgerRecv = 0; }
    
    const totRecv = chargesRecv + ledgerRecv + billsRecv;
    const totPay = chargesPay + ledgerPay + billsPay;
    const netCollect = totRecv - totPay;
    
    if (type === 'receive') {
       if (netCollect <= 0) {
          alert(customerName + " does not owe any money.");
          return;
       }
       const amountStr = prompt(`Collect from ${customerName}\n\nTotal Due: ₹${netCollect.toFixed(2)}\nEnter amount received:`, netCollect.toFixed(2));
       if (!amountStr) return;
       let amount = parseFloat(amountStr);
       if (isNaN(amount) || amount <= 0) { alert("Invalid amount."); return; }
       
       const method = prompt(`Enter payment method (e.g., Cash, Bank, GPay):`, "Cash");
       if (!method) return;
       
       pendingTxs.sort((a,b) => new Date(a.tx.date) - new Date(b.tx.date));
       
       for (let p of pendingTxs) {
         if (amount <= 0) break;
         let payAmt = Math.min(amount, p.owe);
         if (payAmt <= 0) continue;
         
         if (!txs[p.index].raw.payments) txs[p.index].raw.payments = [];
         txs[p.index].raw.payments.push({
           portal: method,
           amount: payAmt
         });
         
         let newTxPay = 0;
         txs[p.index].raw.payments.forEach(x => newTxPay += parseFloat(x.amount));
         let billTot = parseFloat(txs[p.index].raw.billTotal) || 0;
         
         txs[p.index].pendingAmount = Math.max(0, billTot - newTxPay);
         
         if (txs[p.index].pendingAmount === 0) {
           txs[p.index].status = 'Fully Debited';
         } else if (txs[p.index].pendingAmount < billTot) {
           txs[p.index].status = 'Partially Debited';
         }
         
         amount -= payAmt;
       }
       
       // Now pay off pending charges with the remaining amount
       if (amount > 0) {
         let pendingCharges = [];
         txs.forEach((t, i) => {
           if (t.raw && (t.customerName || '').toLowerCase() === customerName.toLowerCase() && t.raw.debits) {
             t.raw.debits.forEach((d, dIdx) => {
               let status = (d.chargesStatus || '').toLowerCase();
               if (status === 'pending' || status === 'partially paid') {
                 let cFee = parseFloat(d.charges) || ((parseFloat(d.amount) || 0) * (parseFloat(d.ratePercent) || 0) / 100);
                 let paid = parseFloat(d.paidAmount) || 0;
                 let owe = cFee - paid;
                 if (owe > 0) {
                   pendingCharges.push({ txIndex: i, dIdx: dIdx, owe: owe, fee: cFee, paid: paid });
                 }
               }
             });
           }
         });
         
         pendingCharges.sort((a,b) => new Date(txs[a.txIndex].date) - new Date(txs[b.txIndex].date));
         
         for (let pc of pendingCharges) {
           if (amount <= 0) break;
           let payAmt = Math.min(amount, pc.owe);
           if (payAmt <= 0) continue;
           
           let d = txs[pc.txIndex].raw.debits[pc.dIdx];
           let newPaid = pc.paid + payAmt;
           
           if (newPaid >= pc.fee - 0.01) {
             d.chargesStatus = 'Fully Paid';
             d.paidAmount = pc.fee;
           } else {
             d.chargesStatus = 'Partially Paid';
             d.paidAmount = newPaid;
           }
           
           amount -= payAmt;
         }
       }
       
       if (amount > 0.01) {
         ledger.push({
           id: 'L' + Date.now(),
           date: new Date().toISOString().split('T')[0],
           type: 'Income',
           amount: amount,
           description: 'Settlement / Charges payment from ' + customerName + ' (' + method + ')',
           subUser: customerName
         });
         localStorage.setItem('cardbills_ledger_entries', JSON.stringify(ledger));
       }
       
       localStorage.setItem('cardbills_transactions', JSON.stringify(txs));
       
       if (typeof renderCustomerBalancesReport === 'function') renderCustomerBalancesReport();
       if (typeof window.renderTransactions === 'function') window.renderTransactions();
       if (typeof window.renderAllTransactions === 'function') window.renderAllTransactions();
       
       alert(`Successfully processed ₹${parseFloat(amountStr).toFixed(2)} from ${customerName}.`);
    } else if (type === 'pay') {
       if (netCollect >= 0) {
          alert(`You don't owe ${customerName} any money.`);
          return;
       }
       let oweCust = Math.abs(netCollect);
       const amountStr = prompt(`Pay to ${customerName}\n\nTotal Due to Customer: ₹${oweCust.toFixed(2)}\nEnter amount paid:`, oweCust.toFixed(2));
       if (!amountStr) return;
       let amount = parseFloat(amountStr);
       if (isNaN(amount) || amount <= 0) { alert("Invalid amount."); return; }
       
       const method = prompt(`Enter payment method (e.g., Cash, Bank, GPay):`, "Cash");
       if (!method) return;
       
       ledger.push({
           id: 'L' + Date.now(),
           date: new Date().toISOString().split('T')[0],
           type: 'Expense',
           amount: amount,
           description: 'Payment to ' + customerName + ' (' + method + ')',
           subUser: customerName
       });
       localStorage.setItem('cardbills_ledger_entries', JSON.stringify(ledger));
       
       if (typeof renderCustomerBalancesReport === 'function') renderCustomerBalancesReport();
       
       alert(`Successfully recorded payment of ₹${amount.toFixed(2)} to ${customerName}.`);
    }
  };

  // --- Net Profit Report Logic ---
  const npStartDate = document.getElementById('npStartDate');
  const npEndDate = document.getElementById('npEndDate');
  const npGenerateBtn = document.getElementById('npGenerateBtn');

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  if(npStartDate) npStartDate.valueAsDate = firstDay;
  if(npEndDate) npEndDate.valueAsDate = today;

  if (npGenerateBtn) {
    npGenerateBtn.addEventListener('click', renderNetProfitReport);
  }

  function renderNetProfitReport() {
    const sDate = npStartDate.value ? new Date(npStartDate.value) : new Date(0);
    const eDate = npEndDate.value ? new Date(npEndDate.value) : new Date();
    eDate.setHours(23, 59, 59, 999);

    const txs = JSON.parse(localStorage.getItem('cardbills_transactions') || '[]');
    const ledger = JSON.parse(localStorage.getItem('cardbills_ledger_entries') || '[]');
    const npListBody = document.getElementById('npListBody');
    if (!npListBody) return;

    let totCustCharges = 0;
    let totPortalCharges = 0;
    let totExpenses = 0;
    
    const dailyData = {};

    txs.forEach(t => {
      const td = new Date(t.date);
      if (td >= sDate && td <= eDate) {
        const dKey = `${td.getFullYear()}-${String(td.getMonth()+1).padStart(2,'0')}-${String(td.getDate()).padStart(2,'0')}`;
        if(!dailyData[dKey]) dailyData[dKey] = { cCharges: 0, pCharges: 0, expenses: 0 };
        
        if (t.raw && t.raw.debits) {
          t.raw.debits.forEach(d => {
            let amt = parseFloat(d.amount) || 0;
            let cFee = parseFloat(d.charges) || (amt * (parseFloat(d.ratePercent) || 0) / 100);
            let pChg = amt * (parseFloat(d.portalPercent) || 0) / 100;
            
            dailyData[dKey].cCharges += cFee;
            dailyData[dKey].pCharges += pChg;
            totCustCharges += cFee;
            totPortalCharges += pChg;
          });
        }
      }
    });

    ledger.forEach(l => {
      const ld = new Date(l.date);
      if (ld >= sDate && ld <= eDate) {
        const dKey = `${ld.getFullYear()}-${String(ld.getMonth()+1).padStart(2,'0')}-${String(ld.getDate()).padStart(2,'0')}`;
        if(!dailyData[dKey]) dailyData[dKey] = { cCharges: 0, pCharges: 0, expenses: 0, extraProfit: 0 };
        
        const typeLower = l.type?.toLowerCase();
        if (typeLower === 'expense') {
          let amt = parseFloat(l.amount) || 0;
          dailyData[dKey].expenses += amt;
          totExpenses += amt;
        }
      }
    });

    const exps = JSON.parse(localStorage.getItem('cardbills_expenses') || '[]');
    exps.forEach(exp => {
      const ed = new Date(exp.date);
      if (ed >= sDate && ed <= eDate) {
        const dKey = `${ed.getFullYear()}-${String(ed.getMonth()+1).padStart(2,'0')}-${String(ed.getDate()).padStart(2,'0')}`;
        if(!dailyData[dKey]) dailyData[dKey] = { cCharges: 0, pCharges: 0, expenses: 0, extraProfit: 0 };
        let amt = parseFloat(exp.amount) || 0;
        dailyData[dKey].expenses += amt;
        totExpenses += amt;
      }
    });

    let totExtraProfit = 0;
    const extraProfits = JSON.parse(localStorage.getItem('cardbills_extra_profit') || '[]');
    extraProfits.forEach(ep => {
      const epd = new Date(ep.date);
      if (epd >= sDate && epd <= eDate) {
        const dKey = `${epd.getFullYear()}-${String(epd.getMonth()+1).padStart(2,'0')}-${String(epd.getDate()).padStart(2,'0')}`;
        if(!dailyData[dKey]) dailyData[dKey] = { cCharges: 0, pCharges: 0, expenses: 0, extraProfit: 0 };
        let amt = parseFloat(ep.amount) || 0;
        dailyData[dKey].extraProfit = (dailyData[dKey].extraProfit || 0) + amt;
        totExtraProfit += amt;
      }
    });

    const chgProfit = totCustCharges - totPortalCharges;
    const netProfit = chgProfit + totExtraProfit;

    document.getElementById('npCustomerCharges').textContent = `₹${totCustCharges.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('npPortalCharges').textContent = `₹${totPortalCharges.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('npChargeProfit').textContent = `₹${chgProfit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('npTotalExpenses').textContent = `₹${totExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('npNetProfit').textContent = `₹${netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    npListBody.innerHTML = '';
    // Sort descending (latest first)
    const sortedDates = Object.keys(dailyData).sort((a,b) => new Date(b) - new Date(a));
    
    const ITEMS_PER_PAGE = 20;
    const totalPages = Math.ceil(sortedDates.length / ITEMS_PER_PAGE) || 1;
    if (!window.currentNpPage || window.currentNpPage < 1) window.currentNpPage = 1;
    if (window.currentNpPage > totalPages) window.currentNpPage = totalPages;
    
    const startIdx = (window.currentNpPage - 1) * ITEMS_PER_PAGE;
    const paginatedDates = sortedDates.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    
    paginatedDates.forEach(dateStr => {
      const data = dailyData[dateStr];
      const dp = data.cCharges - data.pCharges;
      const dex = data.expenses;
      const dnet = dp + (data.extraProfit || 0);
      
      const displayDate = new Date(dateStr).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
      
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #f3f4f6';
      
      const netColor = dnet >= 0 ? '#16a34a' : '#ef4444';
      const netIcon = dnet >= 0 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right: 4px;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right: 4px;"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>';

      tr.innerHTML = `
        <td style="padding: 16px 24px; font-size: 0.9rem; font-weight: 500; color: #1e1b4b;">${displayDate}</td>
        <td style="padding: 16px 24px; font-size: 0.9rem; text-align: right; color: #0284c7; font-weight: 600;">₹${dp.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="padding: 16px 24px; font-size: 0.9rem; text-align: right; color: #dc2626; font-weight: 600;">₹${dex.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="padding: 16px 24px; font-size: 0.9rem; text-align: right; color: ${netColor}; font-weight: 600; display: flex; justify-content: flex-end; align-items: center;">${netIcon} ₹${dnet.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="padding: 16px 24px; text-align: center;">
          <button onclick="openNetProfitDetails('${dateStr}')" class="btn btn-outline btn-sm" style="color: #2563eb; border-color: #bfdbfe; padding: 4px 8px; border-radius: 6px; cursor: pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </td>
      `;
      npListBody.appendChild(tr);
    });

    if (paginatedDates.length === 0) {
      npListBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: #6b7280;">No data found for this period.</td></tr>';
    }
    
    // Pagination UI Update
    const prevBtn = document.getElementById('btnPrevNp');
    const nextBtn = document.getElementById('btnNextNp');
    const pageText = document.getElementById('pageTextNp');
    
    if (pageText) pageText.textContent = `Page ${window.currentNpPage} of ${totalPages}`;
    if (prevBtn) {
      prevBtn.disabled = window.currentNpPage === 1;
      prevBtn.onclick = () => { if(window.currentNpPage > 1) { window.currentNpPage--; window.renderNetProfitReport(); } };
    }
    if (nextBtn) {
      nextBtn.disabled = window.currentNpPage === totalPages;
      nextBtn.onclick = () => { if(window.currentNpPage < totalPages) { window.currentNpPage++; window.renderNetProfitReport(); } };
    }
  }


// --- Customer Balance View Modal Logic ---

let currentCbViewCustomer = null;
let currentCbViewTab = 'charges'; // 'charges', 'bills_receive', 'bills_pay'

window.openCustomerBalanceView = (customerName, customerPhone) => {
  currentCbViewCustomer = customerName;
  document.getElementById('cbModalTitle').textContent = customerName;
  document.getElementById('cbModalPhone').textContent = 'Phone: ' + (customerPhone || 'N/A');
  
  // Calculate stats for this customer
  let allCustomers = JSON.parse(localStorage.getItem('cardbills_customers') || '[]');
  const txs = JSON.parse(localStorage.getItem('cardbills_transactions') || '[]');
  const ledger = JSON.parse(localStorage.getItem('cardbills_ledger_entries') || '[]');
  
  const origCustIndex = allCustomers.findIndex(orig => orig.name === customerName);
  
  let chargesRecv = 0;
  let chargesPay = 0;
  let billsRecv = 0;
  let billsPay = 0;
  
  txs.forEach(t => {
    if (!t.raw) return;
    if ((t.customerName || '').toLowerCase() !== customerName.toLowerCase()) return;
    
    billsRecv += parseFloat(t.raw.billTotal) || 0;
    
    if (t.raw.payments) {
      t.raw.payments.forEach(p => {
         billsPay += parseFloat(p.amount) || 0;
      });
    }
    
    if (t.raw.debits) {
      t.raw.debits.forEach(d => {
        let amt = parseFloat(d.amount) || 0;
        let cFee = parseFloat(d.charges) || (amt * (parseFloat(d.ratePercent) || 0) / 100);
        chargesRecv += cFee; 
        
        let status = (d.chargesStatus || '').toLowerCase();
        let dPaid = parseFloat(d.paidAmount) || 0;
        if (status === 'fully paid' || status === 'settled') {
           chargesPay += cFee;
        } else if (dPaid > 0) {
           chargesPay += dPaid;
        }
      });
    }
  });
  
  let ledgerRecv = 0;
  let ledgerPay = 0;
  
  ledger.forEach(l => {
    if ((l.subUser && l.subUser.trim().toLowerCase() === customerName.trim().toLowerCase()) || (l.description && l.description.toLowerCase().includes(customerName.trim().toLowerCase()))) {
      let lAmt = parseFloat(l.amount) || 0;
      const typeLower = l.type?.toLowerCase();
      if (typeLower === 'expense' || typeLower === 'cash given' || typeLower === 'bank transfer sent') {
        ledgerRecv += lAmt;
      } else if (typeLower === 'income' || typeLower === 'cash received' || typeLower === 'bank transfer received') {
        ledgerPay += lAmt;
      }
    }
  });
  
  let ledgerNet = ledgerRecv - ledgerPay;
  if (ledgerNet > 0) {
    ledgerRecv = ledgerNet; ledgerPay = 0;
  } else {
    ledgerPay = Math.abs(ledgerNet); ledgerRecv = 0;
  }
  
  const totRecv = chargesRecv + ledgerRecv + billsRecv;
  const totPay = chargesPay + ledgerPay + billsPay;
  const netCollect = totRecv - totPay;
  
  document.getElementById('cbModalCharges').textContent = '₹' + chargesRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('cbModalLedger').textContent = '₹' + ledgerRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('cbModalBills').textContent = '₹' + billsRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  
  const netElem = document.getElementById('cbModalNet');
  if (netCollect >= 0) {
    netElem.textContent = '+₹' + netCollect.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    netElem.style.color = '#16a34a';
  } else {
    netElem.textContent = '-₹' + Math.abs(netCollect).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    netElem.style.color = '#dc2626';
  }
  
  document.getElementById('cbTabCharges').textContent = 'Charges (₹' + chargesRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ')';
  document.getElementById('cbTabBillsReceive').textContent = 'Bills - To Receive (₹' + billsRecv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ')';
  document.getElementById('cbTabBillsPay').textContent = 'Bills - To Pay (₹' + billsPay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ')';

  switchCbViewTab('charges');
  document.getElementById('cbViewModal').style.display = 'flex';
};

const closeCbViewModal = () => {
  const m = document.getElementById('cbViewModal');
  if(m) m.style.display = 'none';
};

document.getElementById('cbModalCloseBtn')?.addEventListener('click', closeCbViewModal);
document.getElementById('cbModalCloseBtnFooter')?.addEventListener('click', closeCbViewModal);

document.querySelectorAll('.cb-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    switchCbViewTab(e.currentTarget.getAttribute('data-tab'));
  });
});

function switchCbViewTab(tabId) {
  currentCbViewTab = tabId;
  document.querySelectorAll('.cb-tab').forEach(t => {
    if (t.getAttribute('data-tab') === tabId) {
      t.classList.add('active');
      t.style.color = '#2563eb';
      t.style.borderBottomColor = '#2563eb';
    } else {
      t.classList.remove('active');
      t.style.color = '#6b7280';
      t.style.borderBottomColor = 'transparent';
    }
  });
  
  renderCbViewTable();
}

function renderCbViewTable() {
  const tbody = document.getElementById('cbModalTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (!currentCbViewCustomer) return;
  
  let allCustomers = JSON.parse(localStorage.getItem('cardbills_customers') || '[]');
  const txs = JSON.parse(localStorage.getItem('cardbills_transactions') || '[]');
  const origCustIndex = allCustomers.findIndex(orig => orig.name === currentCbViewCustomer);
  
  // Filter txs for this customer and preserve originalIndex
  const custTxs = txs.map((t, idx) => ({...t, originalIndex: idx}))
                     .filter(t => t.raw && (t.customerName || '').toLowerCase() === currentCbViewCustomer.toLowerCase());
  
  let rows = [];
  const cust = allCustomers[origCustIndex];
  
  if (currentCbViewTab === 'charges' || currentCbViewTab === 'bills_receive') {
    custTxs.forEach(t => {
      let bTotal = parseFloat(t.raw.billTotal) || 0;
      let dateStr = new Date(t.date).toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'}) + '<br><span style="font-size:0.7rem;color:#94a3b8;">' + (t.time || '') + '</span>';
      
      let cardStr = 'Unknown';
      let bankStr = '-';
      
      if (t.raw.cardIndex !== '' && cust && cust.cards && cust.cards[t.raw.cardIndex]) {
        let cardObj = cust.cards[t.raw.cardIndex];
        cardStr = `${cardObj.first} ${cardObj.mid.replace(/\s/g, ' ')} ${cardObj.last}`;
        bankStr = cardObj.bank || '-';
      } else if (t.raw.cardIndex !== '') {
        cardStr = 'Card ' + t.raw.cardIndex;
      }
      
      if (t.raw.debits && t.raw.debits.length > 0) {
        t.raw.debits.forEach(d => {
           let amt = parseFloat(d.amount) || 0;
           let cFee = parseFloat(d.charges) || (amt * (parseFloat(d.ratePercent) || 0) / 100);
           
           if (currentCbViewTab === 'charges' && cFee > 0) {
             rows.push({
               originalIndex: t.originalIndex,
               dateHtml: dateStr,
               card: cardStr,
               bank: bankStr !== '-' ? bankStr : (d.portal || 'Unknown'),
               debitAmt: amt,
               custCharges: cFee,
               paid: 0,
               pending: cFee,
               status: 'Pending'
             });
           }
        });
      }
      
      if (currentCbViewTab === 'bills_receive' && bTotal > 0) {
         rows.push({
           originalIndex: t.originalIndex,
           dateHtml: dateStr,
           card: cardStr,
           bank: bankStr,
           debitAmt: bTotal,
           custCharges: 0,
           paid: 0,
           pending: bTotal,
           status: 'Pending'
         });
      }
    });
  } else if (currentCbViewTab === 'bills_pay') {
    custTxs.forEach(t => {
      if (t.raw.payments && t.raw.payments.length > 0) {
        let dateStr = new Date(t.date).toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'}) + '<br><span style="font-size:0.7rem;color:#94a3b8;">' + (t.time || '') + '</span>';
        
        let cardStr = 'Unknown';
        let bankStr = '-';
        if (t.raw.cardIndex !== '' && cust && cust.cards && cust.cards[t.raw.cardIndex]) {
          let cardObj = cust.cards[t.raw.cardIndex];
          cardStr = `${cardObj.first} ${cardObj.mid.replace(/\s/g, ' ')} ${cardObj.last}`;
          bankStr = cardObj.bank || '-';
        } else if (t.raw.cardIndex !== '') {
          cardStr = 'Card ' + t.raw.cardIndex;
        }
        
        t.raw.payments.forEach(p => {
          let pAmt = parseFloat(p.amount) || 0;
          if (pAmt > 0) {
            rows.push({
               originalIndex: t.originalIndex,
               dateHtml: dateStr,
               card: cardStr,
               bank: bankStr !== '-' ? bankStr : (p.portal || 'Unknown'),
               debitAmt: pAmt,
               custCharges: 0,
               paid: pAmt,
               pending: 0,
               status: 'Completed'
            });
          }
        });
      }
    });
  }
  
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 24px; color: #6b7280;">No records found.</td></tr>';
    return;
  }
  
  rows.forEach(r => {
    let tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e2e8f0';
    
    tr.innerHTML = `
      <td style="padding: 16px 24px; font-size: 0.85rem; color: #1e1b4b;">${r.dateHtml}</td>
      <td style="padding: 16px 24px; font-size: 0.85rem; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
        ${r.card}
      </td>
      <td style="padding: 16px 24px; font-size: 0.85rem; color: #1e1b4b;">${r.bank}</td>
      <td style="padding: 16px 24px; font-size: 0.85rem; color: #1e1b4b; font-weight: 600;">₹${r.debitAmt.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td style="padding: 16px 24px; font-size: 0.85rem; color: #d946ef; font-weight: 600;">₹${r.custCharges.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td style="padding: 16px 24px; font-size: 0.85rem; color: #16a34a; font-weight: 600;">₹${r.paid.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td style="padding: 16px 24px; font-size: 0.85rem; color: #dc2626; font-weight: 600;">₹${r.pending.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td style="padding: 16px 24px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; ${r.status === 'Pending' ? 'background: #fff7ed; color: #f97316; border: 1px solid #fdba74;' : 'background: #f0fdf4; color: #16a34a; border: 1px solid #86efac;'}">
          ${r.status}
        </span>
      </td>
      <td style="padding: 16px 24px;">
        <div style="display: flex; gap: 8px;">
          <button onclick="closeCbViewModal(); if(window.actionView) actionView(${r.originalIndex}); else alert('View not available');" style="background: transparent; border: none; color: #3b82f6; cursor: pointer;" title="View Transaction">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </button>
          <button onclick="closeCbViewModal(); if(window.actionAdd) actionAdd(${r.originalIndex}); else alert('Add Payment not available');" style="background: transparent; border: none; color: #22c55e; cursor: pointer;" title="Add Payment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


  // --- Net Profit Details Modal Logic ---
  window.openNetProfitDetails = (dateStr) => {
    const txs = JSON.parse(localStorage.getItem('cardbills_transactions') || '[]');
    const ledger = JSON.parse(localStorage.getItem('cardbills_ledger_entries') || '[]');
    const npDetailTableBody = document.getElementById('npDetailTableBody');
    if (!npDetailTableBody) return;
    
    npDetailTableBody.innerHTML = '';
    
    // Set date title
    let formattedDate = dateStr;
    try {
      const d = new Date(dateStr);
      if(!isNaN(d)) {
        formattedDate = d.toLocaleDateString('en-US', {
          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
      }
    } catch(e) {}
    
    document.getElementById('npDetailTitle').textContent = formattedDate;
    
    let dailyCustCharges = 0;
    let dailyPortalCharges = 0;
    let dailyExpenses = 0;
    let entryCount = 0;

    txs.forEach(t => {
      if (t.date === dateStr) {
        if (t.raw && t.raw.debits) {
          t.raw.debits.forEach(d => {
            let amt = parseFloat(d.amount) || 0;
            let cFee = parseFloat(d.charges) || (amt * (parseFloat(d.ratePercent) || 0) / 100);
            let pChg = amt * (parseFloat(d.portalPercent) || 0) / 100;
            let profit = cFee - pChg;
            
            dailyCustCharges += cFee;
            dailyPortalCharges += pChg;
            entryCount++;

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #f3f4f6';
            
            const cardDetails = `****${t.cardSuffix || '0000'} <br><span style="font-size:0.75rem;color:#6b7280;">${t.bank || 'Unknown'}</span>`;
            const profitColor = profit >= 0 ? '#16a34a' : '#ef4444';

            tr.innerHTML = `
              <td style="padding: 12px 16px; font-weight: 600; color: #1f2937;">${t.customerName || 'Unknown'}</td>
              <td style="padding: 12px 16px; color: #4b5563; font-size: 0.85rem;">${cardDetails}</td>
              <td style="padding: 12px 16px;"><span style="background: #eff6ff; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; color: #2563eb;">${d.portal || 'Unassigned'}</span></td>
              <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #1f2937;">₹${amt.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td style="padding: 12px 16px; text-align: right; color: #3b82f6; font-weight: 600;">₹${cFee.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td style="padding: 12px 16px; text-align: right; color: #f59e0b; font-weight: 600;">₹${pChg.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td style="padding: 12px 16px; text-align: right; color: ${profitColor}; font-weight: 600;">₹${profit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            `;
            npDetailTableBody.appendChild(tr);
          });
        }
      }
    });

    ledger.forEach(l => {
      if (l.date === dateStr && l.type === 'expense') {
        dailyExpenses += parseFloat(l.amount) || 0;
      }
    });

    const exps = JSON.parse(localStorage.getItem('cardbills_expenses') || '[]');
    exps.forEach(exp => {
      if (exp.date === dateStr) {
        dailyExpenses += parseFloat(exp.amount) || 0;
      }
    });

    let dailyExtraProfit = 0;
    const extraProfits = JSON.parse(localStorage.getItem('cardbills_extra_profit') || '[]');
    extraProfits.forEach(ep => {
      if (ep.date === dateStr) {
        dailyExtraProfit += parseFloat(ep.amount) || 0;
      }
    });

    const dailyProfit = dailyCustCharges - dailyPortalCharges;
    const dailyNet = dailyProfit + dailyExtraProfit;

    document.getElementById('npDetailProfitCharges').textContent = '₹' + dailyProfit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('npDetailExpenses').textContent = '₹' + dailyExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    const netElem = document.getElementById('npDetailNetProfit');
    const netContainer = document.getElementById('npDetailNetContainer');
    
    netElem.textContent = (dailyNet >= 0 ? '+' : '-') + '₹' + Math.abs(dailyNet).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (dailyNet >= 0) {
      netElem.style.color = '#15803d';
      netContainer.style.background = '#f0fdf4';
      netContainer.style.borderColor = '#bbf7d0';
    } else {
      netElem.style.color = '#b91c1c';
      netContainer.style.background = '#fef2f2';
      netContainer.style.borderColor = '#fecaca';
    }

    document.getElementById('npDetailSubTitle').textContent = `Profit Entries (${entryCount})`;
    
    const modal = document.getElementById('npDetailModal');
    if (modal) modal.style.display = 'flex';
  };

  const closeNpDetailModal = () => {
    const modal = document.getElementById('npDetailModal');
    if (modal) modal.style.display = 'none';
  };

  document.getElementById('npDetailCloseBtn')?.addEventListener('click', closeNpDetailModal);
  document.getElementById('npDetailCloseBtnFooter')?.addEventListener('click', closeNpDetailModal);

  window.downloadCustomerReportPDF = () => {
    if (!currentCbViewCustomer) return;
    
    let allCustomers = JSON.parse(localStorage.getItem('cardbills_customers') || '[]');
    const txs = JSON.parse(localStorage.getItem('cardbills_transactions') || '[]');
    const ledger = JSON.parse(localStorage.getItem('cardbills_ledger_entries') || '[]');
    
    const origCustIndex = allCustomers.findIndex(orig => orig.name === currentCbViewCustomer);
    const cust = allCustomers[origCustIndex];
    if (!cust) return;

    let chargesRecv = 0;
    let chargesPay = 0;
    let billsRecv = 0;
    let billsPay = 0;
    
    txs.forEach(t => {
      if (!t.raw || (t.customerName || '').toLowerCase() !== currentCbViewCustomer.toLowerCase()) return;
      billsRecv += parseFloat(t.raw.billTotal) || 0;
      if (t.raw.payments) {
        t.raw.payments.forEach(p => {
           billsPay += parseFloat(p.amount) || 0;
        });
      }
      if (t.raw.debits) {
        t.raw.debits.forEach(d => {
          let amt = parseFloat(d.amount) || 0;
          let cFee = parseFloat(d.charges) || (amt * (parseFloat(d.ratePercent) || 0) / 100);
          chargesRecv += cFee; 
          
          let status = (d.chargesStatus || '').toLowerCase();
          let dPaid = parseFloat(d.paidAmount) || 0;
          if (status === 'fully paid' || status === 'settled') {
             chargesPay += cFee;
          } else if (dPaid > 0) {
             chargesPay += dPaid;
          }
        });
      }
    });
    
    let ledgerRecv = 0;
    let ledgerPay = 0;
    
    ledger.forEach(l => {
      if ((l.subUser && l.subUser.trim().toLowerCase() === currentCbViewCustomer.trim().toLowerCase()) || (l.description && l.description.toLowerCase().includes(currentCbViewCustomer.trim().toLowerCase()))) {
        let lAmt = parseFloat(l.amount) || 0;
        const typeLower = l.type?.toLowerCase();
        if (typeLower === 'expense' || typeLower === 'bank_transfer') {
          ledgerPay += lAmt;
        } else if (typeLower === 'income' || typeLower === 'cash') {
          ledgerRecv += lAmt;
        }
      }
    });
    
    let ledgerNet = ledgerRecv - ledgerPay;
    if (ledgerNet > 0) {
      ledgerRecv = ledgerNet; ledgerPay = 0;
    } else {
      ledgerPay = Math.abs(ledgerNet); ledgerRecv = 0;
    }
    
    const totRecv = chargesRecv + ledgerRecv + billsRecv;
    const totPay = chargesPay + ledgerPay + billsPay;

    const fmt = (n) => Math.round(n).toLocaleString('en-IN');

    document.getElementById('pdfCustName').textContent = currentCbViewCustomer.toUpperCase();
    document.getElementById('pdfCustPhone').textContent = 'Phone: ' + (cust.phone || 'N/A');
    document.getElementById('pdfDate').textContent = new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'});

    // Apply PDF Settings
    let pdfSettings = {};
    try {
      pdfSettings = JSON.parse(localStorage.getItem('cardbills_pdf_settings')) || {};
    } catch(e) {}
    
    document.getElementById('pdfRenderBusinessName').textContent = (pdfSettings.name || 'Business Name').toUpperCase();
    
    if (pdfSettings.address) {
      document.getElementById('pdfRenderBusinessAddress').textContent = pdfSettings.address;
      document.getElementById('pdfRenderBusinessAddress').style.display = 'block';
    } else {
      document.getElementById('pdfRenderBusinessAddress').style.display = 'none';
    }
    
    let contactStr = '';
    if (pdfSettings.phone) contactStr += 'Phone: ' + pdfSettings.phone;
    if (pdfSettings.email) contactStr += (contactStr ? ' | ' : '') + 'Email: ' + pdfSettings.email;
    
    if (contactStr) {
      document.getElementById('pdfRenderBusinessContact').textContent = contactStr;
      document.getElementById('pdfRenderBusinessContact').style.display = 'block';
    } else {
      document.getElementById('pdfRenderBusinessContact').style.display = 'none';
    }

    if (pdfSettings.logoBase64) {
      document.getElementById('pdfRenderLogo').src = pdfSettings.logoBase64;
      document.getElementById('pdfRenderLogo').style.display = 'block';
    } else {
      document.getElementById('pdfRenderLogo').style.display = 'none';
    }

    if (pdfSettings.qrBase64) {
      document.getElementById('pdfRenderQR').src = pdfSettings.qrBase64;
      document.getElementById('pdfRenderQR').style.display = 'block';
    } else {
      document.getElementById('pdfRenderQR').style.display = 'none';
    }

    if (pdfSettings.footer) {
      document.getElementById('pdfRenderFooter').textContent = pdfSettings.footer;
      document.getElementById('pdfRenderFooter').style.display = 'block';
    } else {
      document.getElementById('pdfRenderFooter').style.display = 'none';
    }

    document.getElementById('pdfColCharges').textContent = 'Rs. ' + fmt(chargesRecv);
    document.getElementById('pdfColLedger').textContent = 'Rs. ' + fmt(ledgerRecv);
    document.getElementById('pdfColBills').textContent = 'Rs. ' + fmt(billsRecv);
    document.getElementById('pdfColTotal').textContent = 'Rs. ' + fmt(totRecv);

    document.getElementById('pdfPayLedger').textContent = 'Rs. ' + fmt(ledgerPay);
    document.getElementById('pdfPayBills').textContent = 'Rs. ' + fmt(billsPay);
    document.getElementById('pdfPayTotal').textContent = 'Rs. ' + fmt(totPay);

    const pdfTableBody = document.getElementById('pdfTableBody');
    pdfTableBody.innerHTML = '';

    const custTxs = txs.filter(t => t.raw && (t.customerName || '').toLowerCase() === currentCbViewCustomer.toLowerCase());
    
    custTxs.forEach(t => {
      if (t.raw.debits && t.raw.debits.length > 0) {
        t.raw.debits.forEach(d => {
          const amt = parseFloat(d.amount) || 0;
          const rate = parseFloat(d.ratePercent) || 0;
          const cFee = amt * rate / 100;
          
          let cardStr = 'Unknown';
          if (t.raw.cardIndex !== '' && cust && cust.cards && cust.cards[t.raw.cardIndex]) {
            let cardObj = cust.cards[t.raw.cardIndex];
            cardStr = `${cardObj.bank || 'Card'} **${cardObj.last}`;
          }
          
          const dateStr = new Date(t.date).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'});

          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid #e9d5ff';
          tr.innerHTML = `
            <td style="padding: 8px 6px; border: 1px solid #ddd6fe;">${dateStr}</td>
            <td style="padding: 8px 6px; border: 1px solid #ddd6fe;">${cardStr}</td>
            <td style="padding: 8px 6px; border: 1px solid #ddd6fe; text-align: right; white-space: nowrap;">${fmt(amt)}</td>
            <td style="padding: 8px 6px; border: 1px solid #ddd6fe; text-align: right; white-space: nowrap;">${rate.toFixed(1)}%</td>
            <td style="padding: 8px 6px; border: 1px solid #ddd6fe; text-align: right; white-space: nowrap;">${fmt(cFee)}</td>
            <td style="padding: 8px 6px; border: 1px solid #ddd6fe; text-align: right; white-space: nowrap;">${fmt(cFee)}</td>
          `;
          pdfTableBody.appendChild(tr);
        });
      }
    });

    if (pdfTableBody.children.length === 0) {
      pdfTableBody.closest('table').style.display = 'none';
      pdfTableBody.closest('table').previousElementSibling.style.display = 'none';
    } else {
      pdfTableBody.closest('table').style.display = 'table';
      pdfTableBody.closest('table').previousElementSibling.style.display = 'block';
    }

    // The Bills - To Receive and Bills - To Pay tables have been removed as per user request.
    const pdfReceiveTableBody = document.getElementById('pdfReceiveTableBody');
    if (pdfReceiveTableBody) {
        pdfReceiveTableBody.closest('table').style.display = 'none';
        pdfReceiveTableBody.closest('table').previousElementSibling.style.display = 'none';
    }

    const pdfPayTableBody = document.getElementById('pdfPayTableBody');
    if (pdfPayTableBody) {
        pdfPayTableBody.closest('table').style.display = 'none';
        pdfPayTableBody.closest('table').previousElementSibling.style.display = 'none';
    }

    const element = document.getElementById('pdfTemplate');
    const opt = {
      margin:       10,
      filename:     `${currentCbViewCustomer.toLowerCase().replace(/\s+/g, '_')}_statement.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };
