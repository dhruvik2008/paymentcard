const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const replacement = `  window.openWizardForCard = (custIdx, cardIdx) => {
    try {
      window.editingTransactionIndex = null;
      if (typeof populateWizardCustomers === 'function') populateWizardCustomers();
      else alert("populateWizardCustomers is missing!");
      
      const wCustomer = document.getElementById('wizardCustomer');
      const wCard = document.getElementById('wizardCard');
      
      wCard.disabled = true;
      wCustomer.value = '';
      wCard.innerHTML = '<option value="" disabled selected hidden></option>';
      document.getElementById('wizardTotalAmount').value = '';
      
      if (typeof wizardPayments !== 'undefined') wizardPayments = [];
      if (typeof wizardDebits !== 'undefined') wizardDebits = [];
      
      if (typeof renderWizardPayments === 'function') renderWizardPayments();
      if (typeof renderWizardDebits === 'function') renderWizardDebits();

      if (typeof currentWizardStep !== 'undefined') currentWizardStep = 1;
      if (typeof updateWizardUI === 'function') updateWizardUI();
      
      wCustomer.value = String(custIdx);
      const event = new Event('change');
      wCustomer.dispatchEvent(event);
      wCard.value = String(cardIdx);

      // Fix flex to block just in case
      document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
      document.getElementById('wizardSection').style.display = 'block';
      document.getElementById('breadcrumbCurrent').textContent = 'Transaction Bills / Unified Entry';
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    } catch (e) {
      alert("Error opening card: " + e.message + "\\n" + e.stack);
    }
  };`;

// Replace the old window.openWizardForCard
const targetRegex = /window\.openWizardForCard = \(custIdx, cardIdx\) => \{[\s\S]*?\/\/\s*We don't have a specific nav item[^}]*\n\s*\};/;
if (targetRegex.test(js)) {
  js = js.replace(targetRegex, replacement);
  fs.writeFileSync('script.js', js);
  console.log("Added try-catch and fixed display: block");
} else {
  console.log("Regex didn't match");
}
