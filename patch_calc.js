const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

// Replace updateWizardDebit
content = content.replace(
  "window.updateWizardDebit = (idx, field, val) => { wizardDebits[idx][field] = val; updateWizardUI(); };",
  `window.updateWizardDebit = (idx, field, val) => {
    wizardDebits[idx][field] = val;
    
    // Auto-calculate Charges based on Rate & Amount
    if (field === 'amount' || field === 'ratePercent') {
      const amt = parseFloat(wizardDebits[idx].amount) || 0;
      const rate = parseFloat(wizardDebits[idx].ratePercent) || 0;
      if (amt > 0 && rate > 0) {
        const charges = (amt * rate / 100).toFixed(2);
        wizardDebits[idx].charges = charges;
        const chargesInput = document.getElementById('debit-charges-' + idx);
        if (chargesInput) chargesInput.value = charges;
      }
    } 
    // Auto-calculate Rate based on Charges & Amount
    else if (field === 'charges') {
      const amt = parseFloat(wizardDebits[idx].amount) || 0;
      const charges = parseFloat(wizardDebits[idx].charges) || 0;
      if (amt > 0 && charges >= 0) {
        const rate = ((charges / amt) * 100).toFixed(2);
        wizardDebits[idx].ratePercent = rate;
        const rateInput = document.getElementById('debit-rate-' + idx);
        if (rateInput) rateInput.value = rate;
      }
    }
    
    updateWizardUI(); 
  };`
);

// Add IDs to inputs in renderWizardDebits
content = content.replace(
  /<input type="number" oninput="updateWizardDebit\(\${idx}, 'amount', this\.value\)" value="\${d\.amount}"/g,
  `<input type="number" id="debit-amount-\${idx}" oninput="updateWizardDebit(\${idx}, 'amount', this.value)" value="\${d.amount}"`
);

content = content.replace(
  /<input type="number" oninput="updateWizardDebit\(\${idx}, 'ratePercent', this\.value\)" value="\${d\.ratePercent}"/g,
  `<input type="number" id="debit-rate-\${idx}" oninput="updateWizardDebit(\${idx}, 'ratePercent', this.value)" value="\${d.ratePercent}"`
);

content = content.replace(
  /<input type="number" oninput="updateWizardDebit\(\${idx}, 'charges', this\.value\)" value="\${d\.charges}"/g,
  `<input type="number" id="debit-charges-\${idx}" oninput="updateWizardDebit(\${idx}, 'charges', this.value)" value="\${d.charges}"`
);

fs.writeFileSync('script.js', content);
console.log("Updated script.js successfully");
