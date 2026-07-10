const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// Update renderWizardDebits
const oldRenderDebitsStr = code.substring(code.indexOf('const renderWizardDebits = () => {'), code.indexOf('window.updateWizardDebit =') - 4);

const newRenderDebitsStr = `const renderWizardDebits = () => {
    const container = document.getElementById('debitEntriesContainer');
    const title = document.getElementById('debitEntriesTitle');
    title.textContent = \`Debit Entries (\${wizardDebits.length})\`;
    if (wizardDebits.length === 0) {
      container.innerHTML = '<div style="color: #9ca3af; font-size: 0.9rem; text-align: center; padding: 20px 0; font-style: italic;">No debit entries added yet.</div>';
    } else {
      container.innerHTML = wizardDebits.map((d, idx) => \`
        <div class="payment-row" style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #f3f4f6;">
          <!-- Row 1 -->
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
            <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Debit Amount</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" width="16" height="16" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#9ca3af" stroke="none">₹</text></svg>
                <input type="number" oninput="updateWizardDebit(\${idx}, 'amount', this.value)" value="\${d.amount}" placeholder="Enter amount" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
              </div>
            </div>
            
            <div class="form-group custom-portal-dropdown" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <div onclick="toggleDebitPortalDropdown(\${idx})" style="border: 1px solid \${!d.portal ? '#0ea5e9' : '#d1d5db'}; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: \${!d.portal ? '#9ca3af' : '#374151'}; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
                <span>\${d.portal || 'Portal'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div id="debit-portal-dropdown-\${idx}" class="portal-options-container" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); z-index: 50; max-height: 350px; overflow-y: auto; margin-bottom: 4px;">
                \${savedPortals.map(portal => \`
                  <div onclick="selectDebitPortal(\${idx}, '\${portal}')" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">\${portal}</div>
                \`).join('')}
                <div onclick="addNewDebitPortal(\${idx})" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #0ea5e9; font-weight: 500; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='white'">
                   + Add New Portal
                </div>
              </div>
            </div>
            
            <div class="form-group" style="flex: 1; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Portal %</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db; display: flex; justify-content: space-between; align-items: center;">
                <input type="number" oninput="updateWizardDebit(\${idx}, 'portalPercent', this.value)" value="\${d.portalPercent}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 80%;">
                <span style="color: #6b7280; font-size: 0.9rem; margin-right: 12px;">%</span>
              </div>
            </div>
            
            <div class="form-group" style="flex: 1; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Rate (%)</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db; display: flex; justify-content: space-between; align-items: center;">
                <input type="number" oninput="updateWizardDebit(\${idx}, 'ratePercent', this.value)" value="\${d.ratePercent}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 80%;">
                <span style="color: #6b7280; font-size: 0.9rem; margin-right: 12px;">%</span>
              </div>
            </div>
          </div>
          
          <!-- Row 2 -->
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
            <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Charges</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" width="16" height="16" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#9ca3af" stroke="none">₹</text></svg>
                <input type="number" oninput="updateWizardDebit(\${idx}, 'charges', this.value)" value="\${d.charges}" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
              </div>
            </div>
            
            <div class="form-group custom-portal-dropdown" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #0ea5e9; z-index: 1;">Charges Status</label>
              <div onclick="toggleChargesDropdown(\${idx})" style="border: 1px solid #0ea5e9; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: #374151; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
                <span>\${d.chargesStatus || 'Pending'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div id="charges-dropdown-\${idx}" class="portal-options-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); z-index: 50; overflow: hidden; margin-top: 4px;">
                \${['Pending', 'Partially Paid', 'Fully Paid'].map(status => \`
                  <div onclick="selectChargesStatus(\${idx}, '\${status}')" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">\${status}</div>
                \`).join('')}
              </div>
            </div>
            
            <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Paid Amount</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" width="16" height="16" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#9ca3af" stroke="none">₹</text></svg>
                <input type="number" oninput="updateWizardDebit(\${idx}, 'paidAmount', this.value)" value="\${d.paidAmount}" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
              </div>
            </div>
            
            <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Debit Date</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
                <input type="date" onchange="updateWizardDebit(\${idx}, 'date', this.value)" value="\${d.date}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 100%; color: #374151;">
              </div>
            </div>
          </div>
          
          <!-- Row 3 -->
          <div style="display: flex; gap: 16px; align-items: center;">
            <div class="form-group" style="flex: 1; position: relative; margin-bottom: 0;">
              <input type="text" oninput="updateWizardDebit(\${idx}, 'desc', this.value)" value="\${d.desc}" placeholder="Description" style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; outline: none;">
            </div>
            
            <button type="button" onclick="deleteWizardDebit(\${idx})" style="background: none; border: none; color: #fca5a5; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </div>
      \`).join('');
    }
    updateWizardUI();
  }`;

code = code.replace(oldRenderDebitsStr, newRenderDebitsStr);

// Update addDebitBtn listener to use the new object shape
const oldAddDebitStr = `  document.getElementById('addDebitBtn').addEventListener('click', () => {
    wizardDebits.push({ amount: '', type: '', desc: '', date: new Date().toISOString().split('T')[0] });
    renderWizardDebits();
  });`;

const newAddDebitStr = `  document.getElementById('addDebitBtn').addEventListener('click', () => {
    wizardDebits.push({ 
      amount: '', 
      portal: '', 
      portalPercent: '', 
      ratePercent: '', 
      charges: '', 
      chargesStatus: 'Pending', 
      paidAmount: '', 
      date: new Date().toISOString().split('T')[0], 
      desc: '' 
    });
    renderWizardDebits();
  });`;

code = code.replace(oldAddDebitStr, newAddDebitStr);

// Add the debit custom dropdown handlers
const debitHandlers = `
  window.toggleDebitPortalDropdown = (idx) => {
    const dropdown = document.getElementById(\`debit-portal-dropdown-\${idx}\`);
    if (dropdown.style.display === 'none') {
      document.querySelectorAll('.portal-options-container').forEach(el => el.style.display = 'none');
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  };
  window.selectDebitPortal = (idx, portal) => {
    wizardDebits[idx].portal = portal;
    document.getElementById(\`debit-portal-dropdown-\${idx}\`).style.display = 'none';
    renderWizardDebits();
  };
  window.addNewDebitPortal = (idx) => {
    const newPortal = prompt("Enter new portal name:");
    if (newPortal && newPortal.trim() !== '') {
      savedPortals.push(newPortal.trim());
      wizardDebits[idx].portal = newPortal.trim();
      renderWizardDebits();
    }
  };
  window.toggleChargesDropdown = (idx) => {
    const dropdown = document.getElementById(\`charges-dropdown-\${idx}\`);
    if (dropdown.style.display === 'none') {
      document.querySelectorAll('.portal-options-container').forEach(el => el.style.display = 'none');
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  };
  window.selectChargesStatus = (idx, status) => {
    wizardDebits[idx].chargesStatus = status;
    document.getElementById(\`charges-dropdown-\${idx}\`).style.display = 'none';
    renderWizardDebits();
  };
`;

code = code.replace('window.deleteWizardDebit = (idx) => { wizardDebits.splice(idx, 1); renderWizardDebits(); };', 
                    'window.deleteWizardDebit = (idx) => { wizardDebits.splice(idx, 1); renderWizardDebits(); };' + debitHandlers);

fs.writeFileSync('script.js', code);
console.log('Debits patched successfully');
