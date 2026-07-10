const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

const oldVars = `  let currentWizardStep = 1;`;
const newVars = `  let currentWizardStep = 1;
  let wizardPayments = [];
  let wizardDebits = [];
  
  const getWizardBillTotal = () => parseFloat(document.getElementById('wizardTotalAmount').value) || 0;
  const getWizardPaidTotal = () => wizardPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const getWizardDebitTotal = () => wizardDebits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  
  document.getElementById('wizardTotalAmount').addEventListener('input', () => updateWizardUI());
  
  const renderWizardPayments = () => {
    const container = document.getElementById('paymentEntriesContainer');
    const title = document.getElementById('paymentEntriesTitle');
    title.textContent = \`Payment Entries (\${wizardPayments.length})\`;
    if (wizardPayments.length === 0) {
      container.innerHTML = '<div style="color: #9ca3af; font-size: 0.9rem; text-align: center; padding: 20px 0; font-style: italic;">No payment entries added yet.</div>';
    } else {
      container.innerHTML = wizardPayments.map((p, idx) => \`
        <div class="payment-row" style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
          <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Payment Amount</label>
            <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" width="16" height="16" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#9ca3af" stroke="none">₹</text></svg>
              <input type="number" oninput="updateWizardPayment(\${idx}, 'amount', this.value)" value="\${p.amount}" placeholder="Enter amount" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
            </div>
          </div>
          <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <select onchange="updateWizardPayment(\${idx}, 'portal', this.value)" class="custom-select" style="border-color: #d1d5db; background: #fff; padding: 10px 16px; font-size: 0.9rem; color: #6b7280;">
              <option value="" disabled hidden \${!p.portal ? 'selected' : ''}>Portal</option>
              <option value="Cred" \${p.portal === 'Cred' ? 'selected' : ''}>Cred</option>
              <option value="Cheq" \${p.portal === 'Cheq' ? 'selected' : ''}>Cheq</option>
              <option value="Mobikwik" \${p.portal === 'Mobikwik' ? 'selected' : ''}>Mobikwik</option>
            </select>
          </div>
          <div class="form-group" style="flex: 2; position: relative; margin-bottom: 0;">
            <input type="text" oninput="updateWizardPayment(\${idx}, 'desc', this.value)" value="\${p.desc}" placeholder="Description" style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; outline: none;">
          </div>
          <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Payment Date</label>
            <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
              <input type="date" onchange="updateWizardPayment(\${idx}, 'date', this.value)" value="\${p.date}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 100%; color: #374151;">
            </div>
          </div>
          <button type="button" onclick="deleteWizardPayment(\${idx})" style="background: none; border: none; color: #fca5a5; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      \`).join('');
    }
    updateWizardUI();
  };
  window.updateWizardPayment = (idx, field, val) => { wizardPayments[idx][field] = val; updateWizardUI(); };
  window.deleteWizardPayment = (idx) => { wizardPayments.splice(idx, 1); renderWizardPayments(); };
  document.getElementById('addPaymentBtn').addEventListener('click', () => {
    wizardPayments.push({ amount: '', portal: '', desc: '', date: new Date().toISOString().split('T')[0] });
    renderWizardPayments();
  });

  const renderWizardDebits = () => {
    const container = document.getElementById('debitEntriesContainer');
    const title = document.getElementById('debitEntriesTitle');
    title.textContent = \`Debit Entries (\${wizardDebits.length})\`;
    if (wizardDebits.length === 0) {
      container.innerHTML = '<div style="color: #9ca3af; font-size: 0.9rem; text-align: center; padding: 20px 0; font-style: italic;">No debit entries added yet.</div>';
    } else {
      container.innerHTML = wizardDebits.map((d, idx) => \`
        <div class="payment-row" style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
          <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Debit Amount</label>
            <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" width="16" height="16" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#9ca3af" stroke="none">₹</text></svg>
              <input type="number" oninput="updateWizardDebit(\${idx}, 'amount', this.value)" value="\${d.amount}" placeholder="Enter amount" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
            </div>
          </div>
          <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <select onchange="updateWizardDebit(\${idx}, 'type', this.value)" class="custom-select" style="border-color: #d1d5db; background: #fff; padding: 10px 16px; font-size: 0.9rem; color: #6b7280;">
              <option value="" disabled hidden \${!d.type ? 'selected' : ''}>Type</option>
              <option value="Fee" \${d.type === 'Fee' ? 'selected' : ''}>Fee</option>
              <option value="Charge" \${d.type === 'Charge' ? 'selected' : ''}>Charge</option>
              <option value="Other" \${d.type === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group" style="flex: 2; position: relative; margin-bottom: 0;">
            <input type="text" oninput="updateWizardDebit(\${idx}, 'desc', this.value)" value="\${d.desc}" placeholder="Description" style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; outline: none;">
          </div>
          <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Debit Date</label>
            <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
              <input type="date" onchange="updateWizardDebit(\${idx}, 'date', this.value)" value="\${d.date}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 100%; color: #374151;">
            </div>
          </div>
          <button type="button" onclick="deleteWizardDebit(\${idx})" style="background: none; border: none; color: #fca5a5; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      \`).join('');
    }
    updateWizardUI();
  };
  window.updateWizardDebit = (idx, field, val) => { wizardDebits[idx][field] = val; updateWizardUI(); };
  window.deleteWizardDebit = (idx) => { wizardDebits.splice(idx, 1); renderWizardDebits(); };
  document.getElementById('addDebitBtn').addEventListener('click', () => {
    wizardDebits.push({ amount: '', type: '', desc: '', date: new Date().toISOString().split('T')[0] });
    renderWizardDebits();
  });
`;

code = code.replace(oldVars, newVars);

const oldSummaryLogicStart = `      const bill = parseFloat(document.getElementById('wizardTotalAmount').value) || 0;
      const paid = parseFloat(document.getElementById('wizardPaidAmount').value) || 0;
      const debit = parseFloat(document.getElementById('wizardDebitAmount').value) || 0;
      const pending = bill - paid + debit;`;

const newSummaryLogicStart = `      const bill = getWizardBillTotal();
      const paid = getWizardPaidTotal();
      const debit = getWizardDebitTotal();
      const pending = bill - paid + debit;`;

code = code.replace(oldSummaryLogicStart, newSummaryLogicStart);

const uiUpdates = `
    const bill = getWizardBillTotal();
    const paid = getWizardPaidTotal();
    const debit = getWizardDebitTotal();
    const pending = bill - paid + debit;

    document.getElementById('paymentSummaryTotal').textContent = \`₹\${bill.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;
    document.getElementById('paymentSummaryPaid').textContent = \`₹\${paid.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;
    document.getElementById('paymentSummaryPending').textContent = \`₹\${pending.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;

    document.getElementById('debitSummaryTotal').textContent = \`₹\${bill.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;
    document.getElementById('debitSummaryDebited').textContent = \`₹\${debit.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;
    document.getElementById('debitSummaryPending').textContent = \`₹\${pending.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;
`;

// Insert uiUpdates right after "const updateWizardUI = () => {"
code = code.replace(`const updateWizardUI = () => {`, `const updateWizardUI = () => {${uiUpdates}`);

// Handle reset button
const oldReset = `    wizardCard.innerHTML = '<option value="" disabled selected hidden></option>';
    document.getElementById('wizardTotalAmount').value = '';
    document.getElementById('wizardPaidAmount').value = '';
    document.getElementById('wizardDebitAmount').value = '';`;

const newReset = `    wizardCard.innerHTML = '<option value="" disabled selected hidden></option>';
    document.getElementById('wizardTotalAmount').value = '';
    wizardPayments = [];
    wizardDebits = [];
    renderWizardPayments();
    renderWizardDebits();`;

code = code.replace(oldReset, newReset);

// Handle Submit logic
const oldSubmitLogic = `      const bill = parseFloat(document.getElementById('wizardTotalAmount').value) || 0;
      const paid = parseFloat(document.getElementById('wizardPaidAmount').value) || 0;
      const debit = parseFloat(document.getElementById('wizardDebitAmount').value) || 0;
      const pendingAmount = bill - paid + debit;`;

const newSubmitLogic = `      const bill = getWizardBillTotal();
      const paid = getWizardPaidTotal();
      const debit = getWizardDebitTotal();
      const pendingAmount = bill - paid + debit;`;

code = code.replace(oldSubmitLogic, newSubmitLogic);

fs.writeFileSync('script.js', code);
console.log('Script patched successfully');
