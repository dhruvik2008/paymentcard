const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// First, inject openWizardForCard globally if it doesn't exist
if (!js.includes('window.openWizardForCard')) {
  const wizardLogic = `
  window.openWizardForCard = (custIdx, cardIdx) => {
    // 1. Reset wizard
    window.editingTransactionIndex = null;
    populateWizardCustomers();
    wizardCard.disabled = true;
    wizardCustomer.value = '';
    wizardCard.innerHTML = '<option value="" disabled selected hidden></option>';
    document.getElementById('wizardTotalAmount').value = '';
    wizardPayments = [];
    wizardDebits = [];
    renderWizardPayments();
    renderWizardDebits();

    currentWizardStep = 1;
    updateWizardUI();
    
    // 2. Set the customer and card
    wizardCustomer.value = custIdx;
    
    // Trigger the change event manually to populate the cards dropdown
    const event = new Event('change');
    wizardCustomer.dispatchEvent(event);
    
    wizardCard.value = cardIdx;

    // 3. Hide all sections and show the wizard section
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    wizardSection.style.display = 'flex';
    breadcrumbCurrent.textContent = 'Transaction Bills / Unified Entry';
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    // We don't have a specific nav item for "Add Entry" in the sidebar, or maybe we do, let's just remove active.
  };
`;
  // Insert before window.actionEdit
  js = js.replace('window.actionEdit = (idx, step = 1) => {', wizardLogic + '\n  window.actionEdit = (idx, step = 1) => {');
}

// Next, update renderAllCards to pass sortedCustIndex and cardIndex
const oldRenderMatch = js.match(/customers\.forEach\(\(customer\) => \{/);
if (oldRenderMatch) {
  // Update renderAllCards to use sortedCustomers
  js = js.replace('customers.forEach(customer => {', `const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));\n      sortedCustomers.forEach((customer, sortedCustIndex) => {`);
  js = js.replace('customer.cards.forEach(card => {', `customer.cards.forEach((card, cardIndex) => {`);
  js = js.replace("network: card.type || ''", "network: card.type || '',\n              custIndex: sortedCustIndex,\n              cardIndex: cardIndex");
}

// Next, update filterAndDrawCards to add onclick and cursor: pointer
js = js.replace('<div class="credit-card" style="background', '<div class="credit-card" onclick="openWizardForCard(${c.custIndex}, ${c.cardIndex})" style="background');
js = js.replace('cursor: default;" onmouseover=', 'cursor: pointer;" onmouseover=');

fs.writeFileSync('script.js', js);
console.log("Added openWizardForCard and updated click handler");
