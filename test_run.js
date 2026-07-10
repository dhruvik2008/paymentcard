
class MockElement {
  constructor(id) { this.id = id; this.style = {}; this.classList = { add: ()=>{}, remove: ()=>{}, toggle: ()=>{} }; this.options = []; this.value = ''; }
  addEventListener() {}
  appendChild() {}
  querySelector() { return new MockElement(); }
  querySelectorAll() { return [new MockElement()]; }
  dispatchEvent() {}
}

global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = {
  localStorage: global.localStorage,
  addEventListener: () => {},
  editingTransactionIndex: null
};
global.document = {
  getElementById: (id) => new MockElement(id),
  querySelectorAll: () => [new MockElement()],
  createElement: () => new MockElement(),
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') {
      try {
        cb();
        console.log('Finished DOMContentLoaded successfully!');
      } catch(e) {
        console.error('CRASH in DOMContentLoaded:', e);
      }
    }
  }
};
global.Event = class {};
global.alert = () => {};

// Temporary script to clear out bad settlement transactions
(function() {
  let txs = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
  const originalLength = txs.length;
  // Remove all settlement entries so the user can start fresh
  txs = txs.filter(tx => !tx.isSettlement);
  
  if (txs.length !== originalLength) {
    localStorage.setItem('cardbills_transactions', JSON.stringify(txs));
    console.log("Cleared old settlements.");
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const addCustomerBtn = document.getElementById('addCustomerBtn');
  const addCustomerDrawer = document.getElementById('addCustomerDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const customerListBody = document.getElementById('customerListBody');
  const listHeaderGroup = document.getElementById('listHeaderGroup');
  const customerCountDisplay = document.getElementById('customerCountDisplay');
  const addCustomerForm = document.getElementById('addCustomerForm');
  const viewCustomerDrawer = document.getElementById('viewCustomerDrawer');

  const addCardBtn = document.getElementById('addCardBtn');
  const addedCardsContainer = document.getElementById('addedCardsContainer');
  const noCardsMsg = document.getElementById('noCardsMsg');
  const viewCustomerCardsList = document.getElementById('viewCustomerCardsList');

  let tempCards = [];
  let editingCustomerIndex = -1;
  let editingCardIndex = -1;

  // Load existing customers from localStorage or use default mock data
  let customers = JSON.parse(localStorage.getItem('cardbills_customers')) || [
    { name: 'ABHAY GOSAI' },
    { name: 'AJAY VASTARPARA' },
    { name: 'ALPESH BOKHA' },
    { name: 'ALPESH RATHOD' },
    { name: 'Alpesh solanki' },
    { name: 'Amit Gohel' },
    { name: 'Anil Bhan' }
  ];

  // Function to render customers
  const renderCustomers = () => {
    customerListBody.innerHTML = '';

    // Sort customers alphabetically
    customers.sort((a, b) => a.name.localeCompare(b.name));

    if (customers.length > 0) {
      const firstLetter = customers[0].name.charAt(0).toUpperCase();
      listHeaderGroup.textContent = firstLetter;
    } else {
      listHeaderGroup.textContent = 'No Customers';
    }

    customers.forEach(customer => {
      const initial = customer.name.charAt(0).toUpperCase();
      const row = document.createElement('div');
      row.className = 'customer-row';
      row.innerHTML = `
        <div class="avatar">${initial}</div>
        <div class="customer-name">${customer.name}</div></div>
        `;
      row.addEventListener('click', () => openViewDrawer(customer, customers.indexOf(customer)));
      customerListBody.appendChild(row);
    });

    customerCountDisplay.textContent = `${customers.length} customers`;
  };

  // Initial render
  renderCustomers();

  // Open Drawer
  const openDrawer = () => {
    editingCustomerIndex = -1;
    addCustomerDrawer.classList.add('active');
    drawerOverlay.classList.add('active');
  };

  const bankDomains = {
    "State Bank of India": "onlinesbi.sbi",
    "Punjab National Bank": "pnbindia.in",
    "Bank of Baroda": "bankofbaroda.in",
    "Canara Bank": "canarabank.com",
    "Union Bank of India": "unionbankofindia.co.in",
    "Bank of India": "bankofindia.co.in",
    "Indian Bank": "indianbank.in",
    "Central Bank of India": "centralbankofindia.co.in",
    "Indian Overseas Bank": "iob.in",
    "UCO Bank": "ucobank.com",
    "Bank of Maharashtra": "bankofmaharashtra.in",
    "Punjab & Sind Bank": "punjabandsindbank.co.in",
    "HDFC Bank": "hdfcbank.com",
    "ICICI Bank": "icicibank.com",
    "Axis Bank": "axisbank.com",
    "Kotak Mahindra Bank": "kotak.com",
    "IndusInd Bank": "indusind.com",
    "Yes Bank": "yesbank.in",
    "IDFC First Bank": "idfcfirstbank.com",
    "Federal Bank": "federalbank.co.in",
    "RBL Bank": "rblbank.com",
    "South Indian Bank": "southindianbank.com",
    "Karur Vysya Bank": "kvb.co.in",
    "City Union Bank": "cityunionbank.com",
    "Tamilnad Mercantile Bank": "tmb.in",
    "Dhanlaxmi Bank": "dhanbank.com",
    "Lakshmi Vilas Bank": "dbs.com",
    "Nainital Bank": "nainitalbank.co.in",
    "Bandhan Bank": "bandhanbank.com",
    "CSB Bank": "csb.co.in",
    "DCB Bank": "dcbbank.com",
    "Jammu & Kashmir Bank": "jkbank.com",
    "Citibank": "citibank.co.in",
    "HSBC Bank": "hsbc.co.in",
    "Standard Chartered Bank": "sc.com",
    "Deutsche Bank": "db.com",
    "Barclays Bank": "barclays.in",
    "Bank of America": "bankofamerica.com",
    "American Express Bank": "americanexpress.com",
    "DBS Bank": "dbs.com",
    "AU Small Finance Bank": "aubank.in",
    "Equitas Small Finance Bank": "equitasbank.com",
    "Ujjivan Small Finance Bank": "ujjivansfb.in",
    "Suryoday Small Finance Bank": "suryodaybank.com",
    "Utkarsh Small Finance Bank": "utkarsh.bank",
    "ESAF Small Finance Bank": "esafbank.com",
    "Fincare Small Finance Bank": "fincarebank.com",
    "Jana Small Finance Bank": "janabank.com",
    "North East Small Finance Bank": "nesfb.com",
    "Capital Small Finance Bank": "capitalbank.co.in",
    "Shivalik Small Finance Bank": "shivalikbank.com",
    "Unity Small Finance Bank": "theunitybank.com",
    "Paytm Payments Bank": "paytmpaymentsbank.com",
    "Airtel Payments Bank": "airtel.in",
    "India Post Payments Bank": "ippbonline.com",
    "Fino Payments Bank": "finobank.com",
    "Jio Payments Bank": "jiopaymentsbank.com",
    "NSDL Payments Bank": "nsdlbank.com",
    "One Card": "getonecard.app",
    "Kiwi Card": "gokiwi.in",
    "Uni Card": "uni.cards",
    "Niyo": "goniyo.com",
    "Jupiter": "jupiter.money",
    "Fi Money": "fi.money",
    "Freo": "freo.money"
  };

  const getBankLogo = (bankName) => {
    if (!bankName) return '<div class="bank-logo"></div>';

    if (bankDomains[bankName]) {
      return `
        <div style="width: 24px; height: 24px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: white; border: 1px solid #e5e7eb;">
          <img src="https://www.google.com/s2/favicons?domain=${bankDomains[bankName]}&sz=64" alt="${bankName}" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
      `;
    }

    const initials = bankName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['#991b1b', '#1e40af', '#166534', '#86198f', '#b45309', '#0f766e', '#4c1d95'];
    const colorIndex = bankName.length % colors.length;
    return `
      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${colors[colorIndex]}; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; font-family: sans-serif;">
        ${initials}
      </div>
    `;
  };

  const getCardTypeLogo = (cardType) => {
    if (!cardType) return '';
    switch (cardType.toLowerCase()) {
      case 'visa':
        return `<svg viewBox="0 0 32 10" width="40" height="15"><path fill="#1434CB" d="M14.28 0h-3.08L9.04 9.6h3.25l.65-1.78h3.98l.38 1.78h2.86L14.28 0zm-1.8 5.75l1.45-3.95 1.05 3.95h-2.5zm9.58-5.75c-1.25 0-2.3.62-2.3 1.6 0 1.25 1.95 1.35 1.95 2.1 0 .28-.32.6-1.02.6-1.12 0-1.85-.35-2.28-.6l-.35 1.7c.65.3 1.55.5 2.58.5 1.48 0 2.48-.68 2.48-1.72 0-1.38-2.02-1.5-2.02-2.22 0-.25.28-.52.92-.52.88 0 1.45.22 1.88.42l.35-1.68c-.58-.2-1.3-.43-2.19-.43zm7.04 0h-2.42c-.48 0-.82.15-1.05.65L20.45 9.6h3.42l.68-1.92h4.15L29.1 0zm-2.58 5.72l.98-2.65.65 2.65h-1.63zM8.9 0H6L3.92 6.5.95.8C.72.35.4.1.02 0h-3l4.88 9.6h3.42L8.9 0z"/></svg>`;
      case 'mastercard':
        return `
          <svg width="26" height="16" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill="#EA001B" opacity="0.9"/>
            <circle cx="22" cy="10" r="10" fill="#F79E1B" opacity="0.9"/>
          </svg>
        `;
      case 'rupay':
        return `<div style="font-weight: 800; font-style: italic; font-size: 20px; letter-spacing: -1px; color: #15803d;">RuPay</div>`;
      case 'american express':
        return `<div style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">AMEX</div>`;
      case 'diners club':
        return `<div style="background-color: #000; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">DINERS</div>`;
      default:
        return `<div class="card-type-logo text-blue" style="font-weight: 800; font-style: italic; font-size: 20px; letter-spacing: -1px;">${cardType.toUpperCase()}</div>`;
    }
  };

  const getCardHTML = (card) => {
    return `
      <div class="saved-card-display" style="margin-bottom: 16px;">
        <div class="saved-card-header">
          <div class="bank-logo-wrap">
            ${getBankLogo(card.bank)}
          </div>
          <span class="bank-name">${card.bank}</span>
        </div>
        <div class="card-chip">
          <svg width="24" height="18" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="20" rx="3" fill="#FBBF24"/>
            <line x1="0" y1="10" x2="28" y2="10" stroke="#F59E0B" stroke-width="1.5"/>
            <line x1="14" y1="0" x2="14" y2="20" stroke="#F59E0B" stroke-width="1.5"/>
            <line x1="0" y1="5" x2="14" y2="5" stroke="#F59E0B" stroke-width="1"/>
            <line x1="0" y1="15" x2="14" y2="15" stroke="#F59E0B" stroke-width="1"/>
          </svg>
        </div>
        <div class="card-number-display">${card.first}xx xxxx xxxx ${card.last}</div>
        <div class="saved-card-footer">
          <span class="card-due">Due Date: ${card.dueDate}</span>
          <div class="card-type-logo-wrap">
            ${getCardTypeLogo(card.type)}
          </div>
        </div>
      </div>
    `;
  };

  const openViewDrawer = (customer, index) => {
    editingCustomerIndex = index;
    document.getElementById('viewCustomerInitial').textContent = customer.name.charAt(0).toUpperCase();
    document.getElementById('viewCustomerName').textContent = customer.name;
    document.getElementById('viewCustomerEmail').textContent = customer.email || 'N/A';
    document.getElementById('viewCustomerPhone').textContent = customer.phone || 'N/A';
    document.getElementById('viewCustomerAddress').textContent = customer.address || 'N/A';
    document.getElementById('viewCustomerCreatedAt').textContent = customer.createdAt || 'N/A';
    document.getElementById('viewCustomerUpdatedAt').textContent = customer.updatedAt || 'N/A';

    viewCustomerCardsList.innerHTML = '';
    const cards = customer.cards || [];
    if (cards.length === 0) {
      viewCustomerCardsList.innerHTML = '<div style="color: #6b7280; font-size: 0.95rem;">No cards saved for this customer.</div>';
    } else {
      cards.forEach(card => {
        viewCustomerCardsList.innerHTML += getCardHTML(card);
      });
    }

    viewCustomerDrawer.classList.add('active');
    drawerOverlay.classList.add('active');
  };

  // Edit Customer
  const editCustomerBtn = document.getElementById('editCustomerBtn');
  editCustomerBtn.addEventListener('click', () => {
    if (editingCustomerIndex === -1) return;
    const customer = customers[editingCustomerIndex];
    document.getElementById('customerName').value = customer.name || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerRefName').value = customer.referenceName || '';
    document.getElementById('customerRefPhone').value = customer.referencePhone || '';

    tempCards = customer.cards ? JSON.parse(JSON.stringify(customer.cards)) : [];
    renderAddedCards();

    viewCustomerDrawer.classList.remove('active');
    openDrawer();
  });

  // Delete Customer
  const deleteCustomerBtn = document.getElementById('deleteCustomerBtn');
  if (deleteCustomerBtn) {
    deleteCustomerBtn.addEventListener('click', () => {
      if (editingCustomerIndex === -1) return;

      const confirmDelete = confirm('Are you sure you want to delete this customer? All their details and saved credit cards will be permanently removed.');

      if (confirmDelete) {
        customers.splice(editingCustomerIndex, 1);
        localStorage.setItem('cardbills_customers', JSON.stringify(customers));
        renderCustomers();

        viewCustomerDrawer.classList.remove('active');
        drawerOverlay.classList.remove('active');
        editingCustomerIndex = -1;
      }
    });
  }

  const shortcutAddCardBtn = document.getElementById('shortcutAddCardBtn');
  if (shortcutAddCardBtn) {
    shortcutAddCardBtn.addEventListener('click', () => {
      if (editCustomerBtn) editCustomerBtn.click();
      setTimeout(() => {
        const cardSection = document.getElementById('cardFirst');
        if (cardSection) {
          cardSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardSection.focus();
        }
      }, 300);
    });
  }

  window.removeTempCard = (index) => {
    tempCards.splice(index, 1);
    if (editingCardIndex === index) {
      editingCardIndex = -1;
      addCardBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Card
      `;
      document.getElementById('cardFirst').value = '';
      document.getElementById('cardLast').value = '';
      document.getElementById('cardBank').value = '';
      document.getElementById('cardDueDate').value = '';
      document.getElementById('cardType').value = '';
    } else if (editingCardIndex > index) {
      editingCardIndex--;
    }
    renderAddedCards();
  };

  window.editTempCard = (index) => {
    const card = tempCards[index];
    document.getElementById('cardFirst').value = card.first;
    document.getElementById('cardLast').value = card.last;
    document.getElementById('cardBank').value = card.bank;
    document.getElementById('cardDueDate').value = card.dueDate;
    document.getElementById('cardType').value = card.type;

    editingCardIndex = index;
    addCardBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Update Card
    `;

    const cardSection = document.getElementById('cardFirst');
    if (cardSection) {
      cardSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardSection.focus();
    }
  };

  const renderAddedCards = () => {
    addedCardsContainer.innerHTML = '';
    if (tempCards.length === 0) {
      noCardsMsg.style.display = 'block';
    } else {
      noCardsMsg.style.display = 'none';
      tempCards.forEach((card, idx) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.innerHTML = getCardHTML(card) + `
          <button type="button" onclick="editTempCard(${idx})" title="Edit Card" style="position: absolute; top: -6px; right: 24px; background: #3b82f6; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10; margin-right: 8px;">
            ✎
          </button>
          <button type="button" onclick="removeTempCard(${idx})" title="Remove Card" style="position: absolute; top: -6px; right: -6px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10;">
            ✕
          </button>
        `;
        addedCardsContainer.appendChild(wrapper);
      });
    }
  };

  addCardBtn.addEventListener('click', () => {
    const first = document.getElementById('cardFirst').value.trim();
    const last = document.getElementById('cardLast').value.trim();
    const bank = document.getElementById('cardBank').value;
    const dueDate = document.getElementById('cardDueDate').value;
    const type = document.getElementById('cardType').value;

    if (!first || !last || !bank || !dueDate || !type) {
      alert('Please fill out all card details completely before adding.');
      return;
    }

    if (editingCardIndex !== -1) {
      tempCards[editingCardIndex] = { first, mid: 'xx xxxx', last, bank, dueDate, type };
      editingCardIndex = -1;
      addCardBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Card
      `;
    } else {
      tempCards.push({ first, mid: 'xx xxxx', last, bank, dueDate, type });
    }

    renderAddedCards();

    document.getElementById('cardFirst').value = '';
    document.getElementById('cardLast').value = '';
    document.getElementById('cardBank').value = '';
    document.getElementById('cardDueDate').value = '';
    document.getElementById('cardType').value = '';
  });

  // Close Drawer
  const closeDrawer = () => {
    addCustomerDrawer.classList.remove('active');
    viewCustomerDrawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    addCustomerForm.reset();
    tempCards = [];
    editingCustomerIndex = -1;
    editingCardIndex = -1;
    addCardBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Add Card
    `;
    renderAddedCards();
  };

  addCustomerBtn.addEventListener('click', openDrawer);
  cancelBtn.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  // Save Customer
  saveBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const drawerContent = document.querySelector('.drawer-content');

    // Reset borders
    nameInput.style.border = '';
    phoneInput.style.border = '';

    // Basic validation
    if (!nameInput.value.trim() || !phoneInput.value.trim()) {
      if (!nameInput.value.trim()) nameInput.style.border = '1px solid #ef4444';
      if (!phoneInput.value.trim()) phoneInput.style.border = '1px solid #ef4444';
      alert('Please fill in the required fields (Customer Name and Phone Number) at the top.');
      if (drawerContent) drawerContent.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (phoneInput.value.trim().length !== 10) {
      phoneInput.style.border = '1px solid #ef4444';
      alert('Phone Number must be exactly 10 digits.');
      if (drawerContent) drawerContent.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const refPhoneInput = document.getElementById('customerRefPhone');
    refPhoneInput.style.border = '';
    if (refPhoneInput.value.trim() && refPhoneInput.value.trim().length !== 10) {
      refPhoneInput.style.border = '1px solid #ef4444';
      alert('Reference Contact Number must be exactly 10 digits.');
      if (drawerContent) drawerContent.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Auto-add card if fields are filled but user forgot to click + Add
    const cardFirst = document.getElementById('cardFirst').value.trim();
    const cardLast = document.getElementById('cardLast').value.trim();
    const cardBank = document.getElementById('cardBank').value;
    const cardDueDate = document.getElementById('cardDueDate').value;
    const cardType = document.getElementById('cardType').value;

    if (cardFirst || cardLast || cardBank || cardDueDate || cardType) {
      if (!cardFirst || !cardLast || !cardBank || !cardDueDate || !cardType) {
        alert('You started adding a credit card. Please complete all its details before saving, or clear the fields if you changed your mind.');
        return;
      }

      if (editingCardIndex !== -1) {
        tempCards[editingCardIndex] = { first: cardFirst, mid: 'xx xxxx', last: cardLast, bank: cardBank, dueDate: cardDueDate, type: cardType };
        editingCardIndex = -1;
      } else {
        tempCards.push({ first: cardFirst, mid: 'xx xxxx', last: cardLast, bank: cardBank, dueDate: cardDueDate, type: cardType });
      }
    }

    // Add to array
    const newCustomer = {
      name: nameInput.value.trim(),
      email: document.getElementById('customerEmail').value.trim(),
      phone: phoneInput.value.trim(),
      address: document.getElementById('customerAddress').value.trim(),
      referenceName: document.getElementById('customerRefName').value.trim(),
      referencePhone: document.getElementById('customerRefPhone').value.trim(),
      cards: [...tempCards]
    };

    const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' at ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (editingCustomerIndex !== -1) {
      customers[editingCustomerIndex] = { ...customers[editingCustomerIndex], ...newCustomer, updatedAt: now };
    } else {
      newCustomer.createdAt = now;
      newCustomer.updatedAt = now;
      customers.push(newCustomer);
    }

    // Save to localStorage
    localStorage.setItem('cardbills_customers', JSON.stringify(customers));

    // Re-render and close
    renderCustomers();
    closeDrawer();
  });

  // ==========================================
  // SPA Navigation Logic
  // ==========================================
  const navCustomers = document.getElementById('navCustomers');
  const navTransactionsGroup = document.getElementById('navTransactionsGroup');
  const navTransactionBills = document.getElementById('navTransactionBills');
  const customersSection = document.getElementById('customersSection');
  const transactionsSection = document.getElementById('transactionsSection');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const navAllTransactions = document.getElementById('nav-all-transactions');
    
    // Ledger Nav
    const navLedgerGroup = document.getElementById('navLedgerGroup');
    const ledgerSubmenu = document.getElementById('ledgerSubmenu');
    const navLedgerAllEntries = document.getElementById('navLedgerAllEntries');
    const navLedgerAddEntry = document.getElementById('navLedgerAddEntry');
    const ledgerAllEntriesSection = document.getElementById('ledgerAllEntriesSection');
    const addLedgerEntrySection = document.getElementById('addLedgerEntrySection');

  const navPortalBalances = document.getElementById('nav-portal-balances');
  const allTransactionsSection = document.getElementById('allTransactionsSection');
    const portalBalancesSection = document.getElementById('portalBalancesSection');
  const transactionsSubmenu = document.getElementById('transactionsSubmenu');

  // Helper: hide all page sections, then show the requested one as flex
  const showSection = (sectionEl) => {
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    sectionEl.style.display = 'flex';
  };

  // Handle submenu toggle
  navTransactionsGroup.addEventListener('click', (e) => {
    e.preventDefault();
    navTransactionsGroup.classList.toggle('submenu-open');
    const chevron = navTransactionsGroup.querySelector('.chevron');
    if (navTransactionsGroup.classList.contains('submenu-open')) {
      chevron.style.transform = 'rotate(180deg)';
      transactionsSubmenu.style.display = 'flex';
    } else {
      chevron.style.transform = 'rotate(0deg)';
      transactionsSubmenu.style.display = 'none';
    }
  });

  navLedgerGroup.addEventListener('click', (e) => {
    e.preventDefault();
    navLedgerGroup.classList.toggle('submenu-open');
    const chevron = navLedgerGroup.querySelector('.chevron');
    if (navLedgerGroup.classList.contains('submenu-open')) {
      chevron.style.transform = 'rotate(180deg)';
      ledgerSubmenu.style.display = 'flex';
    } else {
      chevron.style.transform = 'rotate(0deg)';
      ledgerSubmenu.style.display = 'none';
    }
  });

  
  const navAllCards = document.getElementById('navAllCards');
  const allCardsSection = document.getElementById('allCardsSection');
  const allCardsGrid = document.getElementById('allCardsGrid');
  const allCardsSearch = document.getElementById('allCardsSearch');
  const allCardsBankFilter = document.getElementById('allCardsBankFilter');
  const allCardsTypeFilter = document.getElementById('allCardsTypeFilter');
  
  let uniqueCardsCache = [];

  if (navAllCards) {
    navAllCards.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      navAllCards.classList.add('active');
      showSection(allCardsSection);
      breadcrumbCurrent.textContent = 'Credit Cards';
      renderAllCards();
    });
  }

  // Helper to generate a deterministic fake due date & network based on string hash
  function getDeterministicDetails(str, bank) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const dueDates = [1, 5, 7, 12, 15, 18, 20, 21, 24, 26, 28, 30];
    const networks = ['VISA', 'RuPay', 'Mastercard'];
    
    // Default network based on bank if we want
    let net = networks[Math.abs(hash) % networks.length];
    if (bank && bank.toLowerCase().includes('state bank')) net = 'RuPay';
    if (bank && bank.toLowerCase().includes('indusind')) net = 'VISA';

    return {
      dueDate: dueDates[Math.abs(hash) % dueDates.length],
      network: net
    };
  }

  const renderAllCards = () => {
    if (!allCardsGrid) return;
    
    uniqueCardsCache = [];
    
    // Extract actual cards from the customers database
    if (typeof customers !== 'undefined' && Array.isArray(customers)) {
      const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));
      sortedCustomers.forEach((customer, sortedCustIndex) => {
        if (customer.cards && Array.isArray(customer.cards)) {
          customer.cards.forEach((card, cardIndex) => {
            uniqueCardsCache.push({
              customerName: customer.name,
              bank: card.bank || 'Unknown Bank',
              cardSuffix: card.last || 'xxxx',
              first: card.first || 'xxxx',
              dueDate: card.dueDate || '',
              network: card.type || '',
              custIndex: sortedCustIndex,
              cardIndex: cardIndex
            });
          });
        }
      });
    }

    // Populate Bank Dropdown if needed
    const existingBanks = new Set();
    Array.from(allCardsBankFilter.options).forEach(opt => existingBanks.add(opt.value));
    
    uniqueCardsCache.forEach(c => {
      if (c.bank !== 'Unknown Bank' && !existingBanks.has(c.bank)) {
        const opt = document.createElement('option');
        opt.value = c.bank;
        opt.textContent = c.bank;
        allCardsBankFilter.appendChild(opt);
        existingBanks.add(c.bank);
      }
    });

    filterAndDrawCards();
  };

  const filterAndDrawCards = () => {
    if (!allCardsGrid) return;
    
    const query = allCardsSearch.value.toLowerCase();
    const bankFilter = allCardsBankFilter.value;
    const typeFilter = allCardsTypeFilter.value;
    
    const filtered = uniqueCardsCache.filter(c => {
      if (bankFilter !== 'All Banks' && c.bank !== bankFilter) return false;
      if (typeFilter !== 'All Card Types' && c.network !== typeFilter) return false;
      
      if (query) {
        const str = `${c.customerName} ${c.cardSuffix}`.toLowerCase();
        if (!str.includes(query)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      allCardsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">No cards found.</div>';
      return;
    }

    allCardsGrid.innerHTML = filtered.map((c, i) => {
      // Determine logo colors based on network
      let networkLogo = '';
      const net = c.network ? c.network.toLowerCase() : '';
      if (net.includes('visa')) {
        networkLogo = `<span style="font-weight: 800; font-style: italic; color: #1a1f71; font-size: 1.1rem;">VISA</span>`;
      } else if (net.includes('rupay')) {
        networkLogo = `<span style="font-weight: 700; color: #f26522; font-size: 1.1rem; display: flex; align-items: center;">Ru<span style="color: #00a4e4;">Pay</span></span>`;
      } else if (net.includes('mastercard')) {
        networkLogo = `<div style="display: flex;"><div style="width: 16px; height: 16px; background: #eb001b; border-radius: 50%;"></div><div style="width: 16px; height: 16px; background: #f79e1b; border-radius: 50%; margin-left: -6px; mix-blend-mode: multiply;"></div></div>`;
      } else if (net.includes('american express') || net.includes('amex')) {
        networkLogo = `<div style="background: #002663; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold; font-size: 0.6rem; text-align: center; line-height: 1;">AM<br>EX</div>`;
      } else if (net.includes('diners')) {
        networkLogo = `<div style="font-weight: bold; color: #004b8d; font-size: 0.8rem; font-style: italic;">Diners Club</div>`;
      } else if (c.network) {
        networkLogo = `<span style="font-weight: 600; color: #4b5563; font-size: 0.9rem;">${c.network}</span>`;
      }

      // Bank icon using the original getBankLogo function
      // getBankLogo returns an HTML string
      const bankLogoHtml = getBankLogo ? getBankLogo(c.bank) : '';

      // Fix card number rendering
      const first4 = (c.first && c.first.length > 0) ? (c.first.length === 4 ? c.first : c.first.padEnd(4, 'x')) : 'xxxx';
      const last4 = (c.cardSuffix && c.cardSuffix.length > 0) ? (c.cardSuffix.length === 4 ? c.cardSuffix : c.cardSuffix.padStart(4, 'x')) : 'xxxx';
      
      const dueDateDisplay = c.dueDate ? `Due Date: ${c.dueDate}` : '';

      return `
        <div class="credit-card" onclick="openWizardForCard(${c.custIndex}, ${c.cardIndex})" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between; height: 180px; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 15px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)';">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              ${bankLogoHtml}
              <span style="font-weight: 600; font-size: 0.9rem; color: #374151;">${c.bank}</span>
            </div>
          </div>
          
          <div style="z-index: 1; margin-top: 16px;">
            <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="24" rx="4" fill="#FBBF24"/>
              <path d="M4 8H28M4 16H28M12 4V20M20 4V20" stroke="#D97706" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          
          <div style="z-index: 1; margin-top: 12px; font-family: monospace; font-size: 1.1rem; letter-spacing: 2px; color: #111827;">
            ${first4} xxxx xxxx ${last4}
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 1; margin-top: auto;">
            <div>
              <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">${c.customerName}</div>
              <div style="font-size: 0.65rem; color: #9ca3af; margin-top: 2px;">${dueDateDisplay}</div>
            </div>
            <div>
              ${networkLogo}
            </div>
          </div>
          
          <!-- Decorative background element -->
          <div style="position: absolute; right: -20%; bottom: -20%; width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(241,245,249,0.2)); pointer-events: none;"></div>
        </div>
      `;
    }).join('');
  };

  if (allCardsSearch) allCardsSearch.addEventListener('input', filterAndDrawCards);
  if (allCardsBankFilter) allCardsBankFilter.addEventListener('change', filterAndDrawCards);
  if (allCardsTypeFilter) allCardsTypeFilter.addEventListener('change', filterAndDrawCards);



  navCustomers.addEventListener('click', (e) => {
    e.preventDefault();
    navCustomers.classList.add('active');
    navTransactionsGroup.classList.remove('active');
    navTransactionBills.classList.remove('active');
    showSection(customersSection);
    breadcrumbCurrent.textContent = 'Customers';
  });

  
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

  if (navLedgerAllEntries && ledgerAllEntriesSection) {
    navLedgerAllEntries.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      navLedgerAllEntries.classList.add('active');
      showSection(ledgerAllEntriesSection);
      breadcrumbCurrent.textContent = 'All Entries';
      if (typeof renderLedgerEntries === 'function') renderLedgerEntries();
    });
  }

  if (navLedgerAddEntry && addLedgerEntrySection) {
    navLedgerAddEntry.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      navLedgerAddEntry.classList.add('active');
      showSection(addLedgerEntrySection);
      breadcrumbCurrent.textContent = 'Add Ledger Entry';
      if (typeof initAddLedgerEntryForm === 'function') initAddLedgerEntryForm();
    });
  }

  
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


  navTransactionBills.addEventListener('click', (e) => {
    e.preventDefault();
    navCustomers.classList.remove('active');
    navTransactionsGroup.classList.add('active');
    navTransactionBills.classList.add('active');
    showSection(transactionsSection);
    breadcrumbCurrent.textContent = 'Transaction Bills';
    renderTransactions();
  });

  // ==========================================
  // Transactions Logic
  // ==========================================
  const transactionListBody = document.getElementById('transactionListBody');
  let transactions = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
  
  // Migration: Recalculate pending amounts for existing transactions
  transactions.forEach(tx => {
    if (tx.raw) {
      const bill = parseFloat(tx.raw.billTotal) || 0;
      const paid = tx.raw.payments ? tx.raw.payments.reduce((s, p) => s + (parseFloat(p.amount)||0), 0) : 0;
      const debit = tx.raw.debits ? tx.raw.debits.reduce((s, d) => s + (parseFloat(d.amount)||0), 0) : 0;
      
      const pendingAmount = Math.max(0, bill - paid) + Math.max(0, paid - debit);
      
      let stat = 'Pending';
      let statCol = '#f97316';
      if (pendingAmount <= 0) {
        stat = 'Fully Debited';
        statCol = '#10b981';
      }
      
      tx.status = stat;
      tx.statusColor = statCol;
      tx.pending = `₹${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      tx.amountPending = `₹${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
  });
  localStorage.setItem('cardbills_transactions', JSON.stringify(transactions));

  window.actionView = (idx) => {
    window.viewingTransactionIndex = idx;
    const tx = transactions[idx];
    if (!tx.raw) {
      alert('This transaction was created before the view feature was supported.');
      return;
    }

    // Switch Views
    showSection(document.getElementById('viewTransactionSection'));
    breadcrumbCurrent.textContent = 'Transaction Bills / Bill Details';

    // Top Header Data
    const statusEl = document.getElementById('viewTxFullStatus');
    statusEl.textContent = tx.status;
    statusEl.style.backgroundColor = tx.status === 'Fully Debited' ? '#16a34a' : '#f97316';

    document.getElementById('viewTxSubtitle').innerHTML = `#${String(idx + 1).padStart(6, '0')} &bull; ${tx.date}`;

    // Customer Info
    document.getElementById('viewTxAvatar').textContent = tx.customerName.charAt(0).toUpperCase();
    document.getElementById('viewTxCustName').textContent = tx.customerName.toUpperCase();
    document.getElementById('viewTxCustPhone').textContent = tx.customerPhone;

    // Card Info
    document.getElementById('viewTxBankName').textContent = tx.bank;
    document.getElementById('viewTxCardNum').textContent = `**** **** **** ${tx.cardSuffix}`;

    // Bill Info
    document.getElementById('viewTxBillId').textContent = `#${String(idx + 1).padStart(6, '0')}`;
    document.getElementById('viewTxCreatedDate').textContent = tx.date;
    document.getElementById('viewTxCreatedTime').textContent = tx.time;

    // Calculations
    const billTotal = parseFloat(tx.raw.billTotal) || 0;

    let paidTotal = 0;
    if (tx.raw.payments && tx.raw.payments.length > 0) {
      paidTotal = tx.raw.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    }

    let debitTotal = 0;
    let profitTotal = 0;
    if (tx.raw.debits && tx.raw.debits.length > 0) {
      debitTotal = tx.raw.debits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      profitTotal = tx.raw.debits.reduce((sum, d) => {
        let dAmt = parseFloat(d.amount) || 0;
        let dChg = parseFloat(d.charges) || 0;
        let dPaid = parseFloat(d.paidAmount) || 0;
        let dPortalRate = parseFloat(d.portalPercent) || 0;
        
        let profit = 0;
        if (dPaid > 0) {
          profit = dPaid - (dAmt - dChg);
        } else {
          let portalCharges = (dAmt * dPortalRate) / 100;
          profit = dChg - portalCharges;
        }
        return sum + profit;
      }, 0);
    }

    const pendingBill = Math.max(0, billTotal - paidTotal);
    const pendingDebit = Math.max(0, paidTotal - debitTotal);

    // Formatter
    const fmt = (num) => `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Financial Summary
    document.getElementById('viewTxTotalBill').textContent = fmt(billTotal);
    document.getElementById('viewTxPaymentRecv').textContent = fmt(paidTotal);
    document.getElementById('viewTxAmountDebited').textContent = fmt(debitTotal);

    const paidPct = billTotal > 0 ? Math.min(100, (paidTotal / billTotal) * 100) : 0;
    const debitPct = billTotal > 0 ? Math.min(100, (debitTotal / billTotal) * 100) : 0;

    document.getElementById('viewTxPaymentBar').style.width = `${paidPct}%`;
    document.getElementById('viewTxPaymentPct').textContent = `${paidPct.toFixed(1)}% of bill amount`;

    document.getElementById('viewTxDebitBar').style.width = `${debitPct}%`;
    document.getElementById('viewTxDebitPct').textContent = `${debitPct.toFixed(1)}% of bill amount`;

    document.getElementById('viewTxPendingBill').textContent = fmt(pendingBill);
    document.getElementById('viewTxPendingDebit').textContent = fmt(pendingDebit);
    document.getElementById('viewTxTotalProfit').textContent = fmt(profitTotal);

    // Profit Analysis
    document.getElementById('viewTxAnalysisPaid').textContent = fmt(paidTotal);
    document.getElementById('viewTxAnalysisDebited').textContent = fmt(debitTotal);
    document.getElementById('viewTxAnalysisProfit').textContent = fmt(profitTotal);

    const profitMargin = paidTotal > 0 ? (profitTotal / paidTotal) * 100 : 0;
    document.getElementById('viewTxAnalysisMargin').textContent = `${profitMargin.toFixed(2)}%`;

    // Payment History Table
    const pBody = document.getElementById('viewTxPaymentsBodyPage');
    if (tx.raw.payments && tx.raw.payments.length > 0) {
      document.getElementById('viewTxPaymentCount').textContent = `${tx.raw.payments.length} Payment${tx.raw.payments.length !== 1 ? 's' : ''}`;
      pBody.innerHTML = tx.raw.payments.map(p => {
        let pAmt = parseFloat(p.amount) || 0;
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 16px; font-size: 0.9rem;">${tx.date}</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #475569;">${p.portal || '-'}</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #0ea5e9;">${fmt(pAmt)}</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #6b7280;">-</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #ef4444;">₹0.00</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #16a34a;">${fmt(pAmt)}</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #6b7280;">${p.desc || '-'}</td>
            <td style="padding: 16px; text-align: center;">
              <button onclick="actionEdit(${idx})" style="background: none; border: none; cursor: pointer; color: #3b82f6; margin-right: 12px;" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
              <button onclick="actionDelete(${idx})" style="background: none; border: none; cursor: pointer; color: #ef4444;" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      document.getElementById('viewTxPaymentCount').textContent = '0 Payments';
      pBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #6b7280;">No payments recorded</td></tr>`;
    }

    // Debit History Table
    const dBody = document.getElementById('viewTxDebitsBodyPage');
    if (tx.raw.debits && tx.raw.debits.length > 0) {
      dBody.innerHTML = tx.raw.debits.map(d => {
        let dAmt = parseFloat(d.amount) || 0;
        let dChg = parseFloat(d.charges) || 0;
        let dPaid = parseFloat(d.paidAmount) || 0;
        let dRate = (dChg / dAmt) * 100;
        let dPortalRate = parseFloat(d.portalPercent) || 0;
        let dProf = 0;
        let dMargin = 0;
        
        if (dPaid > 0) {
          dProf = dPaid - (dAmt - dChg);
          dMargin = (dProf / dAmt) * 100;
        } else {
          let portalCharges = (dAmt * dPortalRate) / 100;
          dProf = dChg - portalCharges;
          dMargin = dRate - dPortalRate;
        }

        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 16px; font-size: 0.9rem;">${d.date || tx.date}</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #475569;">${d.portal || '-'}</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #0ea5e9;">${fmt(dAmt)}</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #6b7280;">${dRate.toFixed(2)}%</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #ef4444;">${fmt(dChg)}</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #16a34a;">${fmt(dProf)}</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #16a34a;">${dMargin.toFixed(2)}%</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #6b7280;">${d.desc || '-'}</td>
            <td style="padding: 16px; text-align: center;">
              <button onclick="actionEdit(${idx})" style="background: none; border: none; cursor: pointer; color: #3b82f6; margin-right: 12px;" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
              <button onclick="actionDelete(${idx})" style="background: none; border: none; cursor: pointer; color: #ef4444;" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      dBody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: #6b7280;">No debits recorded</td></tr>`;
    }
  };
  window.actionAdd = (idx) => {
    alert(`Add payment/debit to transaction for ${transactions[idx].customerName} (Coming soon)`);
  };
  window.actionInvoice = (idx) => {
    alert(`Generating invoice for ${transactions[idx].customerName} (Coming soon)`);
  };
  
    window.openWizardForCard = (custIdx, cardIdx) => {
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
      
      if (typeof wizardPayments !== 'undefined') wizardPayments = [{ amount: '', portal: '', desc: '', date: new Date().toISOString().split('T')[0] }];
      if (typeof wizardDebits !== 'undefined') wizardDebits = [{
        amount: '',
        portal: '',
        portalPercent: '',
        ratePercent: '',
        charges: '',
        chargesStatus: 'Pending',
        paidAmount: '',
        date: new Date().toISOString().split('T')[0],
        desc: ''
      }];
      
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
      alert("Error opening card: " + e.message + "\n" + e.stack);
    }
  };

  window.actionEdit = (idx, step = 1) => {
    const tx = transactions[idx];
    if (!tx.raw) {
      alert('This transaction was created before the edit feature was supported and cannot be edited.');
      return;
    }
    window.editingTransactionIndex = idx;

    populateWizardCustomers();
    wizardCustomer.value = tx.raw.custIndex;

    wizardCard.innerHTML = '<option value="" disabled selected hidden></option>';
    const customer = [...customers].sort((a, b) => a.name.localeCompare(b.name))[tx.raw.custIndex];
    if (customer.cards && customer.cards.length > 0) {
      wizardCard.disabled = false;
      customer.cards.forEach((card, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${card.bank} - ${card.type} (**** ${card.last})`;
        wizardCard.appendChild(option);
      });
      wizardCard.value = tx.raw.cardIndex;
    } else {
      wizardCard.disabled = true;
    }

    document.getElementById('wizardTotalAmount').value = tx.raw.billTotal;

    wizardPayments = JSON.parse(JSON.stringify(tx.raw.payments));
    wizardDebits = JSON.parse(JSON.stringify(tx.raw.debits));

    renderWizardPayments();
    renderWizardDebits();

    currentWizardStep = step;
    updateWizardUI();
    showSection(wizardSection);
    breadcrumbCurrent.textContent = 'Transaction Bills / Edit Entry';
  };
  window.actionDelete = (idx) => {
    if (confirm(`Are you sure you want to delete the transaction for ${transactions[idx].customerName}?`)) {
      transactions.splice(idx, 1);
      localStorage.setItem('cardbills_transactions', JSON.stringify(transactions));
      renderTransactions();
      if (document.getElementById('viewTransactionSection').style.display === 'flex') {
        showSection(transactionsSection);
        breadcrumbCurrent.textContent = 'Transaction Bills';
      }
    }
  };

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

  

  // ==========================================
  // Portal Balances Logic
  // ==========================================
  const portalTotalBalance = document.getElementById('portalTotalBalance');
  const portalTotalTransactions = document.getElementById('portalTotalTransactions');
  const portalActiveCount = document.getElementById('portalActiveCount');
  const portalCardsGrid = document.getElementById('portalCardsGrid');

  
  const portalDetailSection = document.getElementById('portalDetailSection');
  /* Removed duplicate const portalBalancesSection */
  const backToPortalsBtn = document.getElementById('backToPortalsBtn');
  
  if (backToPortalsBtn) {
    backToPortalsBtn.addEventListener('click', () => {
      portalDetailSection.style.display = 'none';
      portalBalancesSection.style.display = 'block';
    });
  }

  window.showPortalDetails = (portalName) => {
    portalBalancesSection.style.display = 'none';
    portalDetailSection.style.display = 'block';
    
    document.getElementById('portalDetailTitle').textContent = portalName.toUpperCase();
    
    // We need to gather all impacts for this specific portal, sort them from oldest to newest to compute running balance,
    // then render them newest to oldest.
    let portalImpacts = [];
    
    transactions.forEach(tx => {
      // Debits (Customer Swipes) => Increases Portal Balance (Credit to Portal)
      if (tx.raw && tx.raw.debits) {
        tx.raw.debits.forEach(d => {
          const pName = d.portal || 'Unassigned';
          if (pName === portalName) {
            const amt = parseFloat(d.amount) || 0;
            const fee = parseFloat(d.charges) || 0;
            const impact = amt - fee;
            portalImpacts.push({
              dateStr: tx.date,
              timeStr: tx.time || '',
              parsedDate: new Date(`${tx.date} ${tx.time || '12:00 AM'}`),
              desc: 'Customer Debit - Card Debit',
              badge: 'bill debit',
              partyInfo: tx.customerName,
              bankInfo: `${tx.bank || ''} **** ${tx.cardSuffix || ''}`,
              type: 'Credit',
              debitAmt: null,
              creditAmt: impact
            });
          }
        });
      }
      
      // Payments (Bill Payments) => Decreases Portal Balance (Debit to Portal)
      if (tx.raw && tx.raw.payments) {
        tx.raw.payments.forEach(p => {
          const pName = p.portal || 'Unassigned';
          if (pName === portalName) {
            const amt = parseFloat(p.amount) || 0;
            portalImpacts.push({
              dateStr: tx.date,
              timeStr: tx.time || '',
              parsedDate: new Date(`${tx.date} ${tx.time || '12:00 AM'}`),
              desc: 'Bill Payment - Card Payment',
              badge: 'bill payment',
              partyInfo: tx.customerName,
              bankInfo: `${tx.bank || ''} **** ${tx.cardSuffix || ''}`,
              type: 'Debit',
                            type: 'Debit',
              debitAmt: amt,
              creditAmt: null
            });
          }
        });
      }


      const hasDebits = tx.raw && tx.raw.debits && tx.raw.debits.length > 0;
      const hasPayments = tx.raw && tx.raw.payments && tx.raw.payments.length > 0;
      
      
      
      if (!hasDebits && !hasPayments) {
        // Bulletproof fallback
        const getNum = (val) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
          return 0;
        };
        const billAmt = tx.raw ? parseFloat(tx.raw.billTotal || 0) : getNum(tx.bill);
        const paidAmt = getNum(tx.paid);
        
        if (billAmt > 0) {


          allTx.push({
            type: 'Credit',
            dateStr: tx.date,
            timeStr: tx.time,
            timestamp: new Date(`${tx.date} ${tx.time}`).getTime(),
            customer: tx.customerName,
            bank: bankInfo,
            portal: 'General',
            baseAmount: billAmt,
            portalFee: 0,
            customerFee: 0,
            profit: 0,
            impact: billAmt,
            chargesStatus: '',
            originalTxIndex: originalTxIndex
          });
        }
        
        if (paidAmt > 0) {
          allTx.push({
            type: 'Debit',
            dateStr: tx.date,
            timeStr: tx.time,
            timestamp: new Date(`${tx.date} ${tx.time}`).getTime() + 1000,
            customer: tx.customerName,
            bank: bankInfo,
            portal: 'General',
            baseAmount: paidAmt,
            portalFee: 0,
            customerFee: 0,
            profit: 0,
            impact: -paidAmt,
            chargesStatus: '',
            originalTxIndex: originalTxIndex
          });
        }
      }
    });

    // Sort oldest to newest for balance calculation
    // If times are exactly the same, we preserve their original index to make it stable
    portalImpacts.forEach((impact, i) => impact.originalIndex = i);
    portalImpacts.sort((a, b) => {
      const timeDiff = a.parsedDate - b.parsedDate;
      if (timeDiff !== 0) return timeDiff;
      return a.originalIndex - b.originalIndex; // Stable sort fallback
    });
    
    let currentBal = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    
    portalImpacts.forEach(impact => {
      if (impact.type === 'Credit') {
        currentBal += impact.creditAmt;
        totalCredit += impact.creditAmt;
      } else {
        currentBal -= impact.debitAmt;
        totalDebit += impact.debitAmt;
      }
      impact.runningBalance = currentBal;
    });

    // Update Top Summary Cards
    document.getElementById('portalDetailCredit').textContent = '₹' + formatMoney(totalCredit);
    document.getElementById('portalDetailDebit').textContent = '₹' + formatMoney(totalDebit);
    document.getElementById('portalDetailBalance').textContent = '₹' + formatMoney(currentBal);

    // Sort newest to oldest for rendering (reverse of what we just did)
    portalImpacts.sort((a, b) => {
      const timeDiff = b.parsedDate - a.parsedDate;
      if (timeDiff !== 0) return timeDiff;
      return b.originalIndex - a.originalIndex; // Stable reverse sort
    });
    
    const tbody = document.getElementById('portalDetailTableBody');
    if (portalImpacts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #6b7280;">No transactions found.</td></tr>';
      return;
    }

    tbody.innerHTML = portalImpacts.map(impact => {
      const isCredit = impact.type === 'Credit';
      const typeBadge = isCredit 
        ? `<span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Credit</span>`
        : `<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Debit</span>`;
        
      const detailBadge = `<span style="border: 1px solid #d1d5db; color: #6b7280; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; text-transform: uppercase;">${impact.badge}</span>`;

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 16px;">
            <div style="font-weight: 600; font-size: 0.85rem; color: #111827;">${impact.dateStr}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${impact.timeStr}</div>
          </td>
          <td style="padding: 16px;">
            <div style="font-weight: 500; font-size: 0.85rem; color: #111827; margin-bottom: 4px;">${impact.desc}</div>
            ${detailBadge}
          </td>
          <td style="padding: 16px;">
            <div style="font-weight: 600; font-size: 0.85rem; color: #111827;">${impact.partyInfo}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${impact.bankInfo}</div>
          </td>
          <td style="padding: 16px;">${typeBadge}</td>
          <td style="padding: 16px; text-align: right; color: #ef4444; font-weight: 500; font-size: 0.85rem;">
            ${impact.debitAmt !== null ? '₹' + formatMoney(impact.debitAmt) : '-'}
          </td>
          <td style="padding: 16px; text-align: right; color: #16a34a; font-weight: 500; font-size: 0.85rem;">
            ${impact.creditAmt !== null ? '₹' + formatMoney(impact.creditAmt) : '-'}
          </td>
          <td style="padding: 16px; text-align: right; font-weight: 700; color: #111827; font-size: 0.85rem;">
            ₹${formatMoney(impact.runningBalance)}
          </td>
        </tr>
      `;
    }).join('');
  };


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
    if (portalTotalBalance) portalTotalBalance.textContent = `₹${formatMoney(globalTotalBalance)}`;
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

      const cardHTML = `
        <div style="cursor: pointer; transition: transform 0.2s;" onclick="showPortalDetails('${pName}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; overflow: hidden; display: flex; flex-direction: column;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: ${accentColor};"></div>
          
          <div style="padding: 20px 20px 16px 20px; flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #111827; text-transform: uppercase;">${pName}</h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2" width="16" height="16" style="opacity: 0.7;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <p style="color: #6b7280; font-size: 0.75rem; margin-bottom: 24px; display: flex; align-items: center; gap: 4px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              ${data.txCount} transactions
            </p>
            
            <div style="background: ${bgHint}; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
              <p style="color: #6b7280; font-size: 0.75rem; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Current Balance
              </p>
              <h3 style="font-size: 1.5rem; font-weight: 700; color: ${amountColor};">
                ${data.balance < 0 ? '-' : ''}₹${formatMoney(Math.abs(data.balance))}
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
              <p style="color: ${amountColor}; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                ${changeSign}₹${(data.balance / 1000).toFixed(1)}K
                ${isPositive ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>'}
              </p>
            </div>
          </div>
        </div>
      `;
      
      portalCardsGrid.innerHTML += cardHTML;
    });
  };

  
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
    toast.style.borderLeft = `4px solid ${color}`;
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
      style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `;
      document.head.appendChild(style);
    }

    const icon = type === 'success' 
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `
      ${icon}
      <div style="flex: 1;">
        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #111827;">${type === 'success' ? 'Success' : 'Notice'}</h4>
        <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #6b7280;">${message}</p>
      </div>
    `;

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
  
  const settlementDate = document.getElementById('settlementDate');
  const settlementExpected = document.getElementById('settlementExpected');
  const settlementActual = document.getElementById('settlementActual');
  const settlementNotes = document.getElementById('settlementNotes');
  
  let currentExpectedBalance = 0;

  const hideSettlementModal = () => {
    if (settlementModal) settlementModal.style.display = 'none';
  };

  if (closeSettlementModal) closeSettlementModal.addEventListener('click', hideSettlementModal);
  if (cancelSettlementBtn) cancelSettlementBtn.addEventListener('click', hideSettlementModal);

  if (dailySettlementBtn) {
    dailySettlementBtn.addEventListener('click', () => {
      // Calculate current global balance
      currentExpectedBalance = 0;
      transactions.forEach(tx => {
        if (tx.raw && tx.raw.debits) {
          tx.raw.debits.forEach(d => {
            currentExpectedBalance += (parseFloat(d.amount) || 0) - (parseFloat(d.charges) || 0);
          });
        }
        if (tx.raw && tx.raw.payments) {
          tx.raw.payments.forEach(p => {
            currentExpectedBalance -= (parseFloat(p.amount) || 0);
          });
        }
      });

      // Populate UI
      if (settlementDate) settlementDate.value = new Date().toISOString().split('T')[0];
      if (settlementExpected) settlementExpected.value = currentExpectedBalance.toFixed(2);
      if (settlementActual) {
        settlementActual.value = '';
        settlementActual.focus();
      }
      if (settlementNotes) settlementNotes.value = '';
      
      // Disable confirm button
      if (confirmSettlementBtn) {
        confirmSettlementBtn.disabled = true;
        confirmSettlementBtn.style.backgroundColor = '#e5e7eb';
        confirmSettlementBtn.style.color = '#9ca3af';
        confirmSettlementBtn.style.cursor = 'not-allowed';
      }

      if (settlementModal) settlementModal.style.display = 'flex';
    });
  }
  
  if (settlementActual && confirmSettlementBtn) {
    settlementActual.addEventListener('input', () => {
      if (settlementActual.value.trim() !== '') {
        confirmSettlementBtn.disabled = false;
        confirmSettlementBtn.style.backgroundColor = '#0ea5e9';
        confirmSettlementBtn.style.color = 'white';
        confirmSettlementBtn.style.cursor = 'pointer';
      } else {
        confirmSettlementBtn.disabled = true;
        confirmSettlementBtn.style.backgroundColor = '#e5e7eb';
        confirmSettlementBtn.style.color = '#9ca3af';
        confirmSettlementBtn.style.cursor = 'not-allowed';
      }
    });
  }

  if (confirmSettlementBtn) {
    confirmSettlementBtn.addEventListener('click', () => {
      if (confirmSettlementBtn.disabled) return;
      
      const actualBal = parseFloat(settlementActual.value) || 0;
      const diff = actualBal - currentExpectedBalance;
      
      if (Math.abs(diff) < 0.01) {
        showToast('Balance matched perfectly! No adjustment needed.');
        hideSettlementModal();
        return;
      }
      
      // We have a difference, create a reconciliation transaction
      let sDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      if (settlementDate && settlementDate.value) {
        const d = new Date(settlementDate.value);
        if (!isNaN(d)) {
          sDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        }
      }

      let settlementDebits = [];
      let settlementPayments = [];

      if (diff > 0) {
        // Actual is higher -> We gained money -> Record as an inflow (Debit)
        settlementDebits.push({
          id: 'recon_' + Date.now() + Math.random().toString(36).substr(2, 5),
          amount: diff.toFixed(2),
          charges: '0',
          portal: 'System Reconciliation',
          feePercentage: 0
        });
      } else {
        // Actual is lower -> We lost money -> Record as an outflow (Payment)
        settlementPayments.push({
          id: 'recon_' + Date.now() + Math.random().toString(36).substr(2, 5),
          amount: Math.abs(diff).toFixed(2),
          portal: 'System Reconciliation'
        });
      }
      
      const notes = settlementNotes ? settlementNotes.value.trim() : '';

      const settlementTx = {
        id: 'RECON_' + Date.now() + Math.random().toString(36).substr(2, 9),
        date: sDate,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        customerName: 'System Reconciliation',
        customerPhone: '-',
        bank: 'Adjustment',
        cardSuffix: '0000',
        bill: 'System',
        baseAmount: Math.abs(diff).toFixed(2),
        customerFee: 0,
        portalFee: 0,
        profit: 0,
        status: 'Fully Debited',
        notes: notes,
        raw: {
          debits: settlementDebits,
          payments: settlementPayments
        },
        isSettlement: true
      };

      transactions.unshift(settlementTx); // Put at the top of the list
      localStorage.setItem('cardbills_transactions', JSON.stringify(transactions));
      
      hideSettlementModal();
      renderPortalBalances();
      renderAllTransactions();
      renderTransactions();
      
      showToast(`Reconciliation recorded. Balance adjusted by ₹${Math.abs(diff).toFixed(2)}.`);
    });
  }




  const renderAllTransactions = () => {
    if (!ledgerListBody) return;
    let allTx = [];

    const customerSet = new Set();
    const portalSet = new Set();

    transactions.forEach((tx, originalTxIndex) => {
      if (!tx) return;
      // Hide settlement entries from the ledger view
      if (tx.isSettlement) return;
      customerSet.add(tx.customerName);
      const bankInfo = `${tx.bank}`;

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
            timestamp: new Date(`${dateStr} ${tx.time}`).getTime(),
            customer: tx.customerName,
            bank: bankInfo,
            portal: d.portal || 'N/A',
            baseAmount: amt,
            portalFee: portalFee,
            customerFee: customerFee,
            profit: profit,
            impact: amt - portalFee,
            chargesStatus: d.chargesStatus || 'PENDING',
            originalTxIndex: originalTxIndex
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
            timestamp: new Date(`${dateStr} ${tx.time}`).getTime(),
            customer: tx.customerName,
            bank: bankInfo,
            portal: p.portal || 'N/A',
            baseAmount: amt,
            portalFee: 0,
            customerFee: 0,
            profit: 0,
            impact: -amt,
            chargesStatus: '',
            originalTxIndex: originalTxIndex
          });
        });
      }

      const hasDebits = tx.raw && tx.raw.debits && tx.raw.debits.length > 0;
      const hasPayments = tx.raw && tx.raw.payments && tx.raw.payments.length > 0;
      
      
      if (!hasDebits && !hasPayments) {
        // Bulletproof fallback
        const getNum = (val) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
          return 0;
        };
        const billAmt = tx.raw ? parseFloat(tx.raw.billTotal || 0) : getNum(tx.bill);
        const paidAmt = getNum(tx.paid);
        
        if (billAmt > 0) {

          allTx.push({
            type: 'Credit',
            dateStr: tx.date || '',
            timeStr: tx.time || '',
            timestamp: new Date(`${tx.date || ''} ${tx.time || ''}`).getTime(),
            customer: tx.customerName,
            bank: bankInfo,
            portal: 'General',
            baseAmount: billAmt,
            portalFee: 0,
            customerFee: 0,
            profit: 0,
            impact: billAmt,
            chargesStatus: '',
            originalTxIndex: originalTxIndex
          });
        }
        
        if (paidAmt > 0) {
          allTx.push({
            type: 'Debit',
            dateStr: tx.date || '',
            timeStr: tx.time || '',
            timestamp: new Date(`${tx.date || ''} ${tx.time || ''}`).getTime() + 1000,
            customer: tx.customerName,
            bank: bankInfo,
            portal: 'General',
            baseAmount: paidAmt,
            portalFee: 0,
            customerFee: 0,
            profit: 0,
            impact: -paidAmt,
            chargesStatus: '',
            originalTxIndex: originalTxIndex
          });
        }
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

    ledgerTotalCredit.textContent = `₹ ${formatMoney(totalCredit)}`;
    ledgerTotalDebit.textContent = `₹ ${formatMoney(totalDebit)}`;
    ledgerCurrentBalance.textContent = `₹ ${formatMoney(currentBalance)}`;

    filteredTx.reverse();
    ledgerListBody.innerHTML = '';
    if (filteredTx.length === 0) {
      ledgerListBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #6b7280;">No transactions found.</td></tr>';
      return;
    }

    filteredTx.forEach(tx => {
      const tr = document.createElement('tr');
      if (typeof tx.originalTxIndex !== 'undefined') {
        tr.style.cursor = 'pointer';
        tr.style.transition = 'background-color 0.2s';
        tr.onmouseover = () => tr.style.backgroundColor = '#f1f5f9';
        tr.onmouseout = () => tr.style.backgroundColor = '';
        tr.onclick = () => { if (typeof actionEdit === 'function') { document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); document.getElementById('nav-transactions').classList.add('active'); showSection(document.getElementById('transactionsSection')); actionEdit(tx.originalTxIndex); } };
      }
      const isCredit = tx.type === 'Credit';
      const typeBadge = isCredit ? `<span style="border: 1px solid #bfdbfe; color: #3b82f6; background-color: #eff6ff; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Bill Debit</span>` 
                                 : `<span style="border: 1px solid #bfdbfe; color: #3b82f6; background-color: #eff6ff; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Bill Payment</span>`;
      const title = isCredit ? 'Customer Debit - Card Debit' : 'Bill Payment - Credit Card Bill';
      const desc = isCredit ? `Customer Debited: ₹${formatMoney(tx.baseAmount)}` : '';
      const impactColor = isCredit ? '#10b981' : '#ef4444';
      const impactSign = isCredit ? '+' : '';
      
      let chargesHtml = '';
      if (isCredit) {
        chargesHtml = `
          <div style="color: #f59e0b; font-weight: 600;">₹${formatMoney(tx.portalFee)}</div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 2px;">Portal Fee</div>
          <div style="color: #3b82f6; font-weight: 600;">₹${formatMoney(tx.customerFee)}</div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 4px;">Customer Fee</div>
          <span style="border: 1px solid #fbd38d; color: #f59e0b; padding: 2px 8px; border-radius: 12px; font-size: 0.6rem; font-weight: 600; text-transform: uppercase;">${tx.chargesStatus}</span>
        `;
      } else {
        chargesHtml = `<div style="color: #6b7280; font-size: 0.85rem; padding-top: 10px;">No charges</div>`;
      }

      tr.innerHTML = `
        <td style="vertical-align: top; padding: 16px;">
          <div style="color: #111827; font-weight: 500;">${new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</div>
          <div style="color: #6b7280; font-size: 0.85rem;">${tx.timeStr}</div>
        </td>
        <td style="vertical-align: top; padding: 16px;">
          <div style="margin-bottom: 6px;">${typeBadge}</div>
          <div style="color: #111827; font-weight: 500; font-size: 0.95rem;">${title}</div>
          <div style="color: #6b7280; font-size: 0.85rem;">${desc}</div>
        </td>
        <td style="vertical-align: top; padding: 16px;">
          <div style="color: #10b981; font-weight: 600; margin-bottom: 4px;">Portal: ${tx.portal}</div>
          <div style="color: #6b7280; font-size: 0.85rem;">Customer: ${tx.customer} &bull; Bank: ${tx.bank}</div>
        </td>
        <td style="vertical-align: top; text-align: right; padding: 16px;">
          <div style="color: ${impactColor}; font-weight: 700; font-size: 1.05rem; margin-bottom: 4px;">${impactSign}₹${formatMoney(tx.impact)}</div>
          ${isCredit ? `<div style="color: #6b7280; font-size: 0.85rem;">Profit: <span style="color: #10b981;">₹${formatMoney(tx.profit)}</span></div>` : ''}
        </td>
        <td style="vertical-align: top; text-align: right; padding: 16px;">
          ${chargesHtml}
        </td>
        <td style="vertical-align: top; text-align: right; color: #10b981; font-weight: 700; font-size: 1.05rem; padding: 16px;">
          ₹${formatMoney(tx.balance)}
        </td>
      `;
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



  const renderTransactions = () => {
    transactionListBody.innerHTML = '';
    
    

  const searchInput = document.getElementById('transactionSearchInput');
    const statusFilter = document.getElementById('transactionStatusFilter');
    
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const status = statusFilter ? statusFilter.value : 'All Status';
    
    transactions.forEach((tx, index) => {
      // Hide settlement entries from this view
      if (tx.isSettlement) return;
      // Filter logic
      if (status !== 'All Status' && tx.status !== status) return;
      
      if (query) {
        const searchStr = `${tx.customerName} ${tx.customerPhone} ${tx.bank} ${tx.cardSuffix} ${tx.bill} ${tx.date}`.toLowerCase();
        if (!searchStr.includes(query)) return;
      }
      // Calculate charges & profit from raw debits
      let _totalCharges = 0;
      let _totalProfit = 0;
      if (tx.raw && tx.raw.debits && tx.raw.debits.length > 0) {
        tx.raw.debits.forEach(d => {
          const _amt = parseFloat(d.amount) || 0;
          const _portalFee = parseFloat(d.charges) || 0;
          const _customerFee = _amt * (parseFloat(d.ratePercent) || 0) / 100;
          _totalCharges += _portalFee;
          _totalProfit += (parseFloat(d.profit) || (_customerFee - _portalFee));
        });
      }
      const _fmtMoney = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const _profitColor = _totalProfit >= 0 ? '#10b981' : '#ef4444';
      const _profitStr = (_totalProfit < 0 ? '-' : '') + _fmtMoney(_totalProfit);
      const _chargesStr = _fmtMoney(_totalCharges);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="detail-line">
            <span style="font-weight: 500;">${tx.date}</span>
            <span class="text-muted">${tx.time}</span>
          </div>
        </td>
        <td>
          <div class="detail-line">
            <span style="font-weight: 500; font-size: 0.85rem;">${tx.customerName}</span>
            <span class="text-muted"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ${tx.customerPhone}</span>
          </div>
        </td>
        <td>
          <div class="detail-line">
            <span>${tx.bank}</span>
            <span class="text-muted"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> **** ${tx.cardSuffix}</span>
          </div>
        </td>
        <td>
          <div class="detail-line" style="font-size: 0.85rem;">
            <div style="display: flex; gap: 12px;"><span style="color: #6b7280; width: 45px;">Bill:</span> <span class="amount-blue">${tx.bill}</span></div>
            <div style="display: flex; gap: 12px;"><span style="color: #6b7280; width: 45px;">Paid:</span> <span class="amount-blue">${tx.paid}</span></div>
            <div style="display: flex; gap: 12px;"><span style="color: #6b7280; width: 45px;">Pending:</span> <span class="amount-orange">${tx.pending}</span></div>
          </div>
        </td>
        <td>
          <span class="amount-green">${tx.amountPending}</span>
        </td>
        <td>
          <span class="badge-debited">${tx.status}</span>
        </td>
        <td>
          <div class="detail-line" style="font-size: 0.85rem;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="color: #6b7280; width: 60px;">Charges:</span>
              <span style="color: #f97316; font-weight: 500;">${_chargesStr}</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="color: #6b7280; width: 60px;">Profit:</span>
              <span style="color: ${_profitColor}; font-weight: 500;">${_profitStr}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <svg onclick="actionView(${index})" class="action-icon view" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <svg onclick="actionAdd(${index})" class="action-icon add" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <svg onclick="actionInvoice(${index})" class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <svg onclick="actionEdit(${index})" class="action-icon edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <svg onclick="actionDelete(${index})" class="action-icon delete" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </div>
        </td>
      `;
      transactionListBody.appendChild(tr);
    });
  };

  // ==========================================
  // Unified Transaction Entry Wizard Logic
  // ==========================================
  const createEntryBtn = document.getElementById('createEntryBtn');
  const wizardSection = document.getElementById('wizardSection');
  const wizardCancelBtn = document.getElementById('wizardCancelBtn');
  const wizardNextBtn = document.getElementById('wizardNextBtn');
  const wizardBackBtn = document.getElementById('wizardBackBtn');

  const wizardCustomer = document.getElementById('wizardCustomer');
  const wizardCard = document.getElementById('wizardCard');

  let currentWizardStep = 1;
  let wizardPayments = [];
  let wizardDebits = [];
  let savedPortals = ['QR', 'DIGI SAVA', 'BANDHAN BANK', 'RAPIPAY', 'INTERNATIONAL', 'LAKSH FASHION', 'OLD', 'bizz', 'JVP 2', 'VIPUL QR'];

  // Custom dropdown logic
  window.togglePortalDropdown = (idx) => {
    const dropdown = document.getElementById(`portal-dropdown-${idx}`);
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
    document.getElementById(`portal-dropdown-${idx}`).style.display = 'none';
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


  const getWizardBillTotal = () => parseFloat(document.getElementById('wizardTotalAmount').value) || 0;
  const getWizardPaidTotal = () => wizardPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const getWizardDebitTotal = () => wizardDebits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  document.getElementById('wizardTotalAmount').addEventListener('input', () => updateWizardUI());

  const renderWizardPayments = () => {
    const container = document.getElementById('paymentEntriesContainer');
    const title = document.getElementById('paymentEntriesTitle');
    title.textContent = `Payment Entries (${wizardPayments.length})`;
    if (wizardPayments.length === 0) {
      container.innerHTML = '<div style="color: #9ca3af; font-size: 0.9rem; text-align: center; padding: 20px 0; font-style: italic;">No payment entries added yet.</div>';
    } else {
      container.innerHTML = wizardPayments.map((p, idx) => `
        <div class="payment-row" style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
          <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Payment Amount</label>
            <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" width="16" height="16" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#9ca3af" stroke="none">₹</text></svg>
              <input type="number" oninput="updateWizardPayment(${idx}, 'amount', this.value)" value="${p.amount}" placeholder="Enter amount" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
            </div>
          </div>
          <div class="form-group custom-portal-dropdown" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <div onclick="togglePortalDropdown(${idx})" style="border: 1px solid ${!p.portal ? '#0ea5e9' : '#d1d5db'}; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: ${!p.portal ? '#9ca3af' : '#374151'}; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
              <span>${p.portal || 'Select'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div id="portal-dropdown-${idx}" class="portal-options-container" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); z-index: 50; max-height: 350px; overflow-y: auto; margin-bottom: 4px;">
              ${savedPortals.map(portal => `
                <div onclick="selectPortal(${idx}, '${portal}')" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">${portal}</div>
              `).join('')}
              <div onclick="addNewPortal(${idx})" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #0ea5e9; font-weight: 500; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='white'">
                 + Add New Portal
              </div>
            </div>
          </div>
          <div class="form-group" style="flex: 2; position: relative; margin-bottom: 0;">
            <input type="text" oninput="updateWizardPayment(${idx}, 'desc', this.value)" value="${p.desc}" placeholder="Description" style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; outline: none;">
          </div>
          <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
            <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Payment Date</label>
            <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
              <input type="date" onchange="updateWizardPayment(${idx}, 'date', this.value)" value="${p.date}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 100%; color: #374151;">
            </div>
          </div>
          <button type="button" onclick="deleteWizardPayment(${idx})" style="background: none; border: none; color: #fca5a5; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      `).join('');
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
    title.textContent = `Debit Entries (${wizardDebits.length})`;
    if (wizardDebits.length === 0) {
      container.innerHTML = '<div style="color: #9ca3af; font-size: 0.9rem; text-align: center; padding: 20px 0; font-style: italic;">No debit entries added yet.</div>';
    } else {
      container.innerHTML = wizardDebits.map((d, idx) => `
        <div class="payment-row" style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #f3f4f6;">
          <!-- Row 1 -->
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
            <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Debit Amount</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" width="16" height="16" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#9ca3af" stroke="none">₹</text></svg>
                <input type="number" id="debit-amount-${idx}" oninput="updateWizardDebit(${idx}, 'amount', this.value)" value="${d.amount}" placeholder="Enter amount" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
              </div>
            </div>
            
            <div class="form-group custom-portal-dropdown" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <div onclick="toggleDebitPortalDropdown(${idx})" style="border: 1px solid ${!d.portal ? '#0ea5e9' : '#d1d5db'}; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: ${!d.portal ? '#9ca3af' : '#374151'}; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
                <span>${d.portal || 'Select'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div id="debit-portal-dropdown-${idx}" class="portal-options-container" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); z-index: 50; max-height: 350px; overflow-y: auto; margin-bottom: 4px;">
                ${savedPortals.map(portal => `
                  <div onclick="selectDebitPortal(${idx}, '${portal}')" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">${portal}</div>
                `).join('')}
                <div onclick="addNewDebitPortal(${idx})" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #0ea5e9; font-weight: 500; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='white'">
                   + Add New Portal
                </div>
              </div>
            </div>
            
            <div class="form-group" style="flex: 1; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Portal %</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db; display: flex; justify-content: space-between; align-items: center;">
                <input type="number" oninput="updateWizardDebit(${idx}, 'portalPercent', this.value)" value="${d.portalPercent}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 80%;">
                <span style="color: #6b7280; font-size: 0.9rem; margin-right: 12px;">%</span>
              </div>
            </div>
            
            <div class="form-group" style="flex: 1; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Rate (%)</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db; display: flex; justify-content: space-between; align-items: center;">
                <input type="number" id="debit-rate-${idx}" oninput="updateWizardDebit(${idx}, 'ratePercent', this.value)" value="${d.ratePercent}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 80%;">
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
                <input type="number" id="debit-charges-${idx}" oninput="updateWizardDebit(${idx}, 'charges', this.value)" value="${d.charges}" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
              </div>
            </div>
            
            <div class="form-group custom-portal-dropdown" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #0ea5e9; z-index: 1;">Charges Status</label>
              <div onclick="toggleChargesDropdown(${idx})" style="border: 1px solid #0ea5e9; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: #374151; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
                <span>${d.chargesStatus || 'Pending'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div id="charges-dropdown-${idx}" class="portal-options-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); z-index: 50; overflow: hidden; margin-top: 4px;">
                ${['Pending', 'Partially Paid', 'Fully Paid'].map(status => `
                  <div onclick="selectChargesStatus(${idx}, '${status}')" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">${status}</div>
                `).join('')}
              </div>
            </div>
            
            <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Paid Amount</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" width="16" height="16" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#9ca3af" stroke="none">₹</text></svg>
                <input type="number" oninput="updateWizardDebit(${idx}, 'paidAmount', this.value)" value="${d.paidAmount}" style="border: none; outline: none; padding: 10px 0; font-size: 0.9rem; width: 100%;">
              </div>
            </div>
            
            <div class="form-group" style="flex: 1.5; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Debit Date</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db;">
                <input type="date" onchange="updateWizardDebit(${idx}, 'date', this.value)" value="${d.date}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 100%; color: #374151;">
              </div>
            </div>
          </div>
          
          <!-- Row 3 -->
          <div style="display: flex; gap: 16px; align-items: center;">
            <div class="form-group" style="flex: 1; position: relative; margin-bottom: 0;">
              <input type="text" oninput="updateWizardDebit(${idx}, 'desc', this.value)" value="${d.desc}" placeholder="Description" style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; outline: none;">
            </div>
            
            <button type="button" onclick="deleteWizardDebit(${idx})" style="background: none; border: none; color: #fca5a5; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </div>
      `).join('');
    }
    updateWizardUI();
  };
  window.updateWizardDebit = (idx, field, val) => {
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
  };
  window.deleteWizardDebit = (idx) => { wizardDebits.splice(idx, 1); renderWizardDebits(); };
  window.toggleDebitPortalDropdown = (idx) => {
    const dropdown = document.getElementById(`debit-portal-dropdown-${idx}`);
    if (dropdown.style.display === 'none') {
      document.querySelectorAll('.portal-options-container').forEach(el => el.style.display = 'none');
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  };
  window.selectDebitPortal = (idx, portal) => {
    wizardDebits[idx].portal = portal;
    document.getElementById(`debit-portal-dropdown-${idx}`).style.display = 'none';
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
    const dropdown = document.getElementById(`charges-dropdown-${idx}`);
    if (dropdown.style.display === 'none') {
      document.querySelectorAll('.portal-options-container').forEach(el => el.style.display = 'none');
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  };
  window.selectChargesStatus = (idx, status) => {
    wizardDebits[idx].chargesStatus = status;
    document.getElementById(`charges-dropdown-${idx}`).style.display = 'none';
    renderWizardDebits();
  };

  document.getElementById('addDebitBtn').addEventListener('click', () => {
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
  });


  const populateWizardCustomers = () => {
    wizardCustomer.innerHTML = '<option value="" disabled selected hidden></option>';
    const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));
    sortedCustomers.forEach((cust, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = cust.name;
      wizardCustomer.appendChild(option);
    });
  };

  wizardCustomer.addEventListener('change', () => {
    const selectedIndex = wizardCustomer.value;
    wizardCard.innerHTML = '<option value="" disabled selected hidden></option>';
    if (selectedIndex !== '') {
      const customer = [...customers].sort((a, b) => a.name.localeCompare(b.name))[selectedIndex];
      if (customer.cards && customer.cards.length > 0) {
        wizardCard.disabled = false;
        customer.cards.forEach((card, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `${card.bank} - ${card.type} (**** ${card.last})`;
          wizardCard.appendChild(option);
        });
      } else {
        wizardCard.disabled = true;
        const option = document.createElement('option');
        option.textContent = 'No cards saved for this customer';
        option.disabled = true;
        wizardCard.appendChild(option);
      }
    } else {
      wizardCard.disabled = true;
    }
  });

  const updateWizardUI = () => {
    const bill = getWizardBillTotal();
    const paid = getWizardPaidTotal();
    const debit = getWizardDebitTotal();
    const pending = Math.max(0, bill - paid) + Math.max(0, paid - debit);

    document.getElementById('paymentSummaryTotal').textContent = `₹${bill.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('paymentSummaryPaid').textContent = `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('paymentSummaryPending').textContent = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    document.getElementById('debitSummaryTotal').textContent = `₹${bill.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('debitSummaryDebited').textContent = `₹${debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('debitSummaryPending').textContent = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (currentWizardStep === 4) {
      const custIndex = wizardCustomer.value;
      const cardIndex = wizardCard.value;
      const customer = [...customers].sort((a, b) => a.name.localeCompare(b.name))[custIndex];
      const card = customer.cards[cardIndex];

      const bill = getWizardBillTotal();
      const paid = getWizardPaidTotal();
      const debit = getWizardDebitTotal();
      const pending = Math.max(0, bill - paid) + Math.max(0, paid - debit);

      document.getElementById('summaryCustomer').textContent = customer.name;
      document.getElementById('summaryCard').textContent = `${card.bank} (**** ${card.last})`;
      document.getElementById('summaryBill').textContent = `₹${bill.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      document.getElementById('summaryPaid').textContent = `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      document.getElementById('summaryDebit').textContent = `₹${debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      document.getElementById('summaryPending').textContent = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    // Update steps
    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`wizardStep${i}`);
      const viewEl = document.getElementById(`wizardView${i}`);

      if (i < currentWizardStep) {
        stepEl.className = 'progress-step completed';
      } else if (i === currentWizardStep) {
        stepEl.className = 'progress-step active';
      } else {
        stepEl.className = 'progress-step';
      }

      if (viewEl) {
        viewEl.style.display = (i === currentWizardStep) ? 'block' : 'none';
      }
    }

    // Update buttons
    if (currentWizardStep === 1) {
      wizardBackBtn.style.pointerEvents = 'none';
      wizardBackBtn.style.color = '#9ca3af';
    } else {
      wizardBackBtn.style.pointerEvents = 'auto';
      wizardBackBtn.style.color = '#374151';
    }

    if (currentWizardStep === 4) {
      wizardNextBtn.innerHTML = 'Submit';
    } else {
      wizardNextBtn.innerHTML = `Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    }
  };

  createEntryBtn.addEventListener('click', () => {
    window.editingTransactionIndex = null;
    populateWizardCustomers();
    wizardCard.disabled = true;
    wizardCustomer.value = '';
    wizardCard.innerHTML = '<option value="" disabled selected hidden></option>';
    document.getElementById('wizardTotalAmount').value = '';
    wizardPayments = [{ amount: '', portal: '', desc: '', date: new Date().toISOString().split('T')[0] }];
    wizardDebits = [{
      amount: '',
      portal: '',
      portalPercent: '',
      ratePercent: '',
      charges: '',
      chargesStatus: 'Pending',
      paidAmount: '',
      date: new Date().toISOString().split('T')[0],
      desc: ''
    }];
    renderWizardPayments();
    renderWizardDebits();

    currentWizardStep = 1;
    updateWizardUI();
    showSection(wizardSection);
    breadcrumbCurrent.textContent = 'Transaction Bills / Unified Entry';
  });

  wizardCancelBtn.addEventListener('click', () => {
    window.editingTransactionIndex = null;
    showSection(transactionsSection);
    breadcrumbCurrent.textContent = 'Transaction Bills';
  });

  document.getElementById('viewTxBackBtn').addEventListener('click', () => {
    showSection(transactionsSection);
    breadcrumbCurrent.textContent = 'Transaction Bills';
  });

  wizardNextBtn.addEventListener('click', () => {
    if (currentWizardStep === 1) {
      if (!wizardCustomer.value || (!wizardCard.value && wizardCard.options.length > 1)) {
        alert('Please select a Customer and a Card before proceeding.');
        return;
      }
    }
    if (currentWizardStep < 4) {
      currentWizardStep++;
      updateWizardUI();
    } else {
      const custIndex = wizardCustomer.value;
      const cardIndex = wizardCard.value;
      const customer = [...customers].sort((a, b) => a.name.localeCompare(b.name))[custIndex];
      const card = customer.cards[cardIndex];

      const bill = getWizardBillTotal();
      const paid = getWizardPaidTotal();
      const debit = getWizardDebitTotal();
      const pendingAmount = Math.max(0, bill - paid) + Math.max(0, paid - debit);

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      let stat = 'Pending';
      let statCol = '#f97316';
      if (pendingAmount <= 0) {
        stat = 'Fully Debited';
        statCol = '#10b981';
      }

      const txData = {
        date: dateStr, time: timeStr,
        customerName: customer.name, customerPhone: customer.phone,
        bank: card.bank, cardSuffix: card.last,
        bill: `₹${bill.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        paid: `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        pending: `₹${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        amountPending: `₹${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        status: stat, statusColor: statCol,
        raw: {
          custIndex: custIndex,
          cardIndex: cardIndex,
          billTotal: bill,
          payments: JSON.parse(JSON.stringify(wizardPayments)),
          debits: JSON.parse(JSON.stringify(wizardDebits))
        }
      };

      if (window.editingTransactionIndex !== null) {
        txData.date = transactions[window.editingTransactionIndex].date;
        txData.time = transactions[window.editingTransactionIndex].time;
        transactions[window.editingTransactionIndex] = txData;
      } else {
        transactions.unshift(txData);
      }
      window.editingTransactionIndex = null;

      localStorage.setItem('cardbills_transactions', JSON.stringify(transactions));
      renderTransactions();

      alert('Transaction Submitted Successfully!');
      wizardSection.style.display = 'none';
      transactionsSection.style.display = 'block';
      breadcrumbCurrent.textContent = 'Transaction Bills';
    }
  });

  wizardBackBtn.addEventListener('click', () => {
    if (currentWizardStep > 1) {
      currentWizardStep--;
      updateWizardUI();
    }
  });

  const searchInput = document.getElementById('transactionSearchInput');
  const statusFilter = document.getElementById('transactionStatusFilter');
  if (searchInput) searchInput.addEventListener('input', renderTransactions);
  if (statusFilter) statusFilter.addEventListener('change', renderTransactions);


  // ==========================================
  // GENERAL LEDGER LOGIC
  // ==========================================

  const glTotalEntries = document.getElementById('glTotalEntries');
  const glNetBalance = document.getElementById('glNetBalance');
  const glTotalIncome = document.getElementById('glTotalIncome');
  const glTotalExpenses = document.getElementById('glTotalExpenses');
  const glSearchInput = document.getElementById('glSearchInput');
  const glCustomerFilter = document.getElementById('glCustomerFilter');
  const glTypeFilter = document.getElementById('glTypeFilter');
  const glListBody = document.getElementById('glListBody');
  const glEmptyState = document.getElementById('glEmptyState');
  const glTableContainer = document.getElementById('glTableContainer');
  
  const glAddEntryForm = document.getElementById('glAddEntryForm');
  const glAddEntryBtnTop = document.getElementById('glAddEntryBtnTop');
  const glAddEntryBtnEmpty = document.getElementById('glAddEntryBtnEmpty');
  const glCancelBtn = document.getElementById('glCancelBtn');

  // Utility to get and set
  const getLedgerEntries = () => {
    return JSON.parse(localStorage.getItem('cardbills_ledger_entries') || '[]');
  };
  const saveLedgerEntries = (entries) => {
    localStorage.setItem('cardbills_ledger_entries', JSON.stringify(entries));
  };

  // Switch to Add Entry Section
  const goToAddEntry = () => {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('navLedgerAddEntry').classList.add('active');
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    document.getElementById('addLedgerEntrySection').style.display = 'flex';
    document.getElementById('breadcrumbCurrent').textContent = 'Add Ledger Entry';
    initAddLedgerEntryForm();
  };

  if(glAddEntryBtnTop) glAddEntryBtnTop.addEventListener('click', goToAddEntry);
  if(glAddEntryBtnEmpty) glAddEntryBtnEmpty.addEventListener('click', goToAddEntry);

  if(glCancelBtn) {
    glCancelBtn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      document.getElementById('navLedgerAllEntries').classList.add('active');
      document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
      document.getElementById('ledgerAllEntriesSection').style.display = 'flex';
      document.getElementById('breadcrumbCurrent').textContent = 'All Entries';
      renderLedgerEntries();
    });
  }

  window.initAddLedgerEntryForm = () => {
    glAddEntryForm.reset();
    document.getElementById('glDate').valueAsDate = new Date();
    document.getElementById('glSubmitBtn').disabled = false;
    
    // Populate Portal Dropdown
    const predefinedPortals = [
      "QR", "DIGI SAVA", "BANDHAN BANK", "RAPIPAY", "INTERNATIONAL", 
      "LAKSH FASHION", "OLD", "bizz", "JVP 2", "VIPUL QR"
    ];
    const portalSelect = document.getElementById('glPortal');
    portalSelect.innerHTML = '<option value="" disabled selected hidden></option>';
    predefinedPortals.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      portalSelect.appendChild(opt);
    });

    // Populate Sub User Dropdown from customers (or keep placeholder)
    const customers = JSON.parse(localStorage.getItem('cardbills_customers') || '[]');
    const subUserSelect = document.getElementById('glSubUser');
    subUserSelect.innerHTML = '<option value="">Select Sub User</option>';
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = c.name;
      subUserSelect.appendChild(opt);
    });
  };

  if (glAddEntryForm) {
    glAddEntryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entries = getLedgerEntries();
      
      const newEntry = {
        id: 'gl_' + Date.now(),
        type: document.getElementById('glEntryType').value,
        amount: parseFloat(document.getElementById('glAmount').value) || 0,
        date: document.getElementById('glDate').value,
        category: document.getElementById('glCategory').value,
        subUser: document.getElementById('glSubUser').value,
        portal: document.getElementById('glPortal').value,
        description: document.getElementById('glDescription').value,
        timestamp: new Date().toISOString()
      };

      entries.unshift(newEntry);
      saveLedgerEntries(entries);
      
      alert('Ledger Entry created successfully!');
      
      // Go back to list
      glCancelBtn.click(); 
    });
  }

  window.renderLedgerEntries = () => {
    if (!glListBody) return;
    const entries = getLedgerEntries();
    
    // Compute summaries
    let totalIncome = 0;
    let totalExpense = 0;

    entries.forEach(e => {
      // Treat Income, Cash Received, Bank Transfer Received as Income
      if (['Income', 'Cash Received', 'Bank Transfer Received'].includes(e.type)) {
        totalIncome += e.amount;
      } else if (['Expense', 'Cash Given', 'Bank Transfer Sent'].includes(e.type)) {
        totalExpense += e.amount;
      }
    });

    const net = totalIncome - totalExpense;

    if (glTotalEntries) glTotalEntries.textContent = entries.length;
    if (glNetBalance) {
      glNetBalance.textContent = (net >= 0 ? '₹' : '-₹') + Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      glNetBalance.style.color = net >= 0 ? '#10b981' : '#ef4444';
    }
    if (glTotalIncome) glTotalIncome.textContent = '+₹' + totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if (glTotalExpenses) glTotalExpenses.textContent = '-₹' + totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    // Populate Filters if empty
    if (glCustomerFilter.children.length <= 1) {
      const customers = JSON.parse(localStorage.getItem('cardbills_customers') || '[]');
      customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        glCustomerFilter.appendChild(opt);
      });
    }

    // Filter
    let filtered = entries;
    const searchVal = (glSearchInput.value || '').toLowerCase();
    const typeVal = glTypeFilter.value;
    const custVal = glCustomerFilter.value;

    if (searchVal) {
      filtered = filtered.filter(e => 
        (e.description && e.description.toLowerCase().includes(searchVal)) ||
        (e.subUser && e.subUser.toLowerCase().includes(searchVal)) ||
        (e.category && e.category.toLowerCase().includes(searchVal)) ||
        (e.portal && e.portal.toLowerCase().includes(searchVal))
      );
    }
    if (typeVal && typeVal !== 'All Types') {
      filtered = filtered.filter(e => e.type === typeVal);
    }
    if (custVal) {
      filtered = filtered.filter(e => e.subUser === custVal);
    }

    if (filtered.length === 0) {
      glTableContainer.style.display = 'none';
      glEmptyState.style.display = 'flex';
      glEmptyState.querySelector('p').textContent = entries.length > 0 ? 'No matching entries found' : 'No ledger entries found';
    } else {
      glTableContainer.style.display = 'block';
      glEmptyState.style.display = 'none';
    }

    glListBody.innerHTML = '';
    filtered.forEach(e => {
      const isIncome = ['Income', 'Cash Received', 'Bank Transfer Received'].includes(e.type);
      const amtColor = isIncome ? '#10b981' : '#ef4444';
      const amtSign = isIncome ? '+' : '-';
      
      const dateObj = new Date(e.date);
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight: 500; color: #111827;">${formattedDate}</div>
        </td>
        <td>
          <div style="font-weight: 500; color: #111827;">${e.type}</div>
          <div style="font-size: 0.85rem; color: #6b7280;">${e.category}</div>
        </td>
        <td>
          <div style="font-size: 0.9rem; color: #374151;">${e.portal || '-'}</div>
          ${e.subUser ? `<div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;"><span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">User: ${e.subUser}</span></div>` : ''}
          ${e.description ? `<div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;">${e.description}</div>` : ''}
        </td>
        <td style="text-align: right;">
          <span style="font-weight: 600; color: ${amtColor}; padding: 4px 10px; border-radius: 6px; background-color: ${isIncome ? '#d1fae5' : '#fee2e2'};">
            ${amtSign}₹${e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-outline btn-sm gl-del-btn" data-id="${e.id}" style="color: #ef4444; border-color: #fecaca; padding: 4px 8px;">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      `;
      glListBody.appendChild(tr);
    });

    document.querySelectorAll('.gl-del-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = ev.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this ledger entry?')) {
          const fresh = getLedgerEntries().filter(x => x.id !== id);
          saveLedgerEntries(fresh);
          renderLedgerEntries();
        }
      });
    });
  };

  if (glSearchInput) glSearchInput.addEventListener('input', renderLedgerEntries);
  if (glCustomerFilter) glCustomerFilter.addEventListener('change', renderLedgerEntries);
  if (glTypeFilter) glTypeFilter.addEventListener('change', renderLedgerEntries);

});
