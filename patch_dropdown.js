const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// 1. Add savedPortals to state
const oldVars = `  let currentWizardStep = 1;
  let wizardPayments = [];
  let wizardDebits = [];`;

const newVars = `  let currentWizardStep = 1;
  let wizardPayments = [];
  let wizardDebits = [];
  let savedPortals = ['QR', 'DIGI SAVA', 'BANDHAN BANK', 'RAPIPAY', 'INTERNATIONAL', 'LAKSH FASHION', 'OLD', 'bizz', 'JVP 2', 'VIPUL QR'];
  
  // Custom dropdown logic
  window.togglePortalDropdown = (idx) => {
    const dropdown = document.getElementById(\`portal-dropdown-\${idx}\`);
    if (dropdown.style.display === 'none') {
      // Close all other dropdowns
      document.querySelectorAll('.portal-options-container').forEach(el => el.style.display = 'none');
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  };
  
  window.selectPortal = (idx, portal) => {
    wizardPayments[idx].portal = portal;
    document.getElementById(\`portal-dropdown-\${idx}\`).style.display = 'none';
    renderWizardPayments();
  };
  
  window.addNewPortal = (idx) => {
    const newPortal = prompt("Enter new portal name:");
    if (newPortal && newPortal.trim() !== '') {
      savedPortals.push(newPortal.trim());
      wizardPayments[idx].portal = newPortal.trim();
      renderWizardPayments();
    }
  };

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-portal-dropdown')) {
      document.querySelectorAll('.portal-options-container').forEach(el => el.style.display = 'none');
    }
  });
`;

code = code.replace(oldVars, newVars);

// 2. Replace the <select> in renderWizardPayments
const oldSelect = `<div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <select onchange="updateWizardPayment(\${idx}, 'portal', this.value)" class="custom-select" style="border-color: #d1d5db; background: #fff; padding: 10px 16px; font-size: 0.9rem; color: #6b7280;">
              <option value="" disabled hidden \${!p.portal ? 'selected' : ''}>Portal</option>
              <option value="Cred" \${p.portal === 'Cred' ? 'selected' : ''}>Cred</option>
              <option value="Cheq" \${p.portal === 'Cheq' ? 'selected' : ''}>Cheq</option>
              <option value="Mobikwik" \${p.portal === 'Mobikwik' ? 'selected' : ''}>Mobikwik</option>
            </select>
          </div>`;

const newSelect = `<div class="form-group custom-portal-dropdown" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <div onclick="togglePortalDropdown(\${idx})" style="border: 1px solid \${!p.portal ? '#0ea5e9' : '#d1d5db'}; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: \${!p.portal ? '#9ca3af' : '#374151'}; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
              <span>\${p.portal || 'Select portal'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div id="portal-dropdown-\${idx}" class="portal-options-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); z-index: 50; max-height: 250px; overflow-y: auto; margin-top: 4px;">
              \${savedPortals.map(portal => \`
                <div onclick="selectPortal(\${idx}, '\${portal}')" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">\${portal}</div>
              \`).join('')}
              <div onclick="addNewPortal(\${idx})" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #0ea5e9; font-weight: 500; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='white'">
                 + Add New Portal
              </div>
            </div>
          </div>`;

code = code.replace(oldSelect, newSelect);

fs.writeFileSync('script.js', code);
console.log('Dropdown patched successfully');
