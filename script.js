document.addEventListener('DOMContentLoaded', () => {
    // Pagination Global State
    let currentTxPage = 1;
    let currentAllTxPage = 1;
    let currentExpensesPage = 1;
    let currentExtraProfitPage = 1;
    let currentUdharPage = 1;
    const ITEMS_PER_PAGE = 20;

    const loggedInEmail = localStorage.getItem('cardbills_logged_in_user_email') || 'User';
    const welcomeHeader = document.getElementById('welcomeUserHeader');
    if (welcomeHeader) {
        welcomeHeader.textContent = `Welcome back, ${loggedInEmail}!`;
    }

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
    ];

    // MIGRATION: Automatically delete any duplicate customers by name (case-insensitive) and merge their cards
    let hasDuplicates = false;
    const uniqueCustomers = [];
    const seenNames = new Map(); // map lowerName to index in uniqueCustomers
    
    customers.forEach(c => {
        const lowerName = (c.name || '').trim().toLowerCase();
        if (!seenNames.has(lowerName)) {
            seenNames.set(lowerName, uniqueCustomers.length);
            uniqueCustomers.push(c);
        } else {
            hasDuplicates = true;
            // Merge cards if the duplicate has cards
            if (c.cards && c.cards.length > 0) {
                const existingIdx = seenNames.get(lowerName);
                const existing = uniqueCustomers[existingIdx];
                if (!existing.cards) existing.cards = [];
                // Only push cards that don't already exist (by last 4 digits & bank)
                c.cards.forEach(newCard => {
                    const isCardDuplicate = existing.cards.some(ec => ec.bank === newCard.bank && ec.last === newCard.last);
                    if (!isCardDuplicate) {
                        existing.cards.push(newCard);
                    }
                });
            }
        }
    });

    if (hasDuplicates) {
        customers = uniqueCustomers;
        localStorage.setItem('cardbills_customers', JSON.stringify(customers));
        if (window.firebaseDB && localStorage.getItem('cardbills_logged_in_user_email')) {
            const encodedEmail = localStorage.getItem('cardbills_logged_in_user_email').toLowerCase().replace(/\./g, '_').replace(/@/g, '_at_');
            window.firebaseDB.write('users/' + encodedEmail + '/cardbills_customers', customers).catch(e => { });
        }
    }

    // Function to render customers
    const renderCustomers = () => {
        customerListBody.innerHTML = '';

        const searchInputEl = document.getElementById('searchInput');
        const query = searchInputEl ? searchInputEl.value.toLowerCase().trim() : '';

        // Filter out invalid customers and apply search
        let filteredCustomers = customers.filter(c => {
            if (!c || typeof c.name !== 'string' || c.name.trim().length === 0) return false;
            if (query) {
                const phone = c.phone ? String(c.phone).toLowerCase() : '';
                const email = c.email ? c.email.toLowerCase() : '';
                return c.name.toLowerCase().includes(query) || phone.includes(query) || email.includes(query);
            }
            return true;
        });

        // Sort customers alphabetically
        filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));

        if (filteredCustomers.length > 0) {
            const firstLetter = filteredCustomers[0].name.charAt(0).toUpperCase();
            listHeaderGroup.textContent = firstLetter;
        } else {
            listHeaderGroup.textContent = 'No Customers';
        }

        filteredCustomers.forEach(customer => {
            const initial = customer.name.charAt(0).toUpperCase();
            const row = document.createElement('div');
            row.className = 'customer-row';
            row.innerHTML = `
        <div class="avatar">${initial}</div>
        <div class="customer-name">${customer.name}</div>
        `;
            row.addEventListener('click', () => openViewDrawer(customer, customers.indexOf(customer)));
            customerListBody.appendChild(row);
        });

        customerCountDisplay.textContent = `${filteredCustomers.length} customers`;
    };

    const searchInputEl = document.getElementById('searchInput');
    if (searchInputEl) {
        searchInputEl.addEventListener('input', renderCustomers);
    }

    // Initial render
    renderDashboard();
    renderCustomers();

    // Allow 'Enter' key to move to the next input field for better mobile/keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) {
                if (active.id === 'searchInput' || active.id === 'transactionSearchInput') return;
                let container = active.closest('.modal') || active.closest('.page-section') || document.body;
                const focusable = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled])')).filter(el => {
                    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === active;
                });
                const idx = focusable.indexOf(active);
                if (idx > -1 && idx < focusable.length - 1) {
                    e.preventDefault();
                    focusable[idx + 1].focus();
                } else if (idx === focusable.length - 1) {
                    active.blur();
                    const primaryBtn = container.querySelector('#wizardNextBtn, #saveBtn, .btn-primary');
                    if (primaryBtn && primaryBtn.offsetParent !== null) {
                        primaryBtn.click();
                    }
                }
            }
        }
    });

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
          <img src="https://www.google.com/s2/favicons?domain=${bankDomains[bankName]}&sz=64" alt="${bankName}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size:10px; font-weight:bold; color:#1e3a8a;\\'>${bankName.substring(0, 2).toUpperCase()}</span>';">
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
        addCustomerDrawer.classList.add('active');
        drawerOverlay.classList.add('active');
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
          <button type="button" onclick="editTempCard(${idx})" title="Edit Card" style="position: absolute; top: -6px; right: 24px; background: #6366f1; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10; margin-right: 8px;">
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
        document.getElementById('saveBtn').disabled = false;
    };

    addCustomerBtn.addEventListener('click', openDrawer);
    cancelBtn.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);

    // Save Customer
    saveBtn.addEventListener('click', () => {
        saveBtn.disabled = true;
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
            saveBtn.disabled = false;
            return;
        }

        if (phoneInput.value.trim().length !== 10) {
            phoneInput.style.border = '1px solid #ef4444';
            alert('Phone Number must be exactly 10 digits.');
            if (drawerContent) drawerContent.scrollTo({ top: 0, behavior: 'smooth' });
            saveBtn.disabled = false;
            return;
        }

        const refPhoneInput = document.getElementById('customerRefPhone');
        refPhoneInput.style.border = '';
        if (refPhoneInput.value.trim() && refPhoneInput.value.trim().length !== 10) {
            refPhoneInput.style.border = '1px solid #ef4444';
            alert('Reference Contact Number must be exactly 10 digits.');
            if (drawerContent) drawerContent.scrollTo({ top: 0, behavior: 'smooth' });
            saveBtn.disabled = false;
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
                saveBtn.disabled = false;
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
        const newName = nameInput.value.trim();
        
        if (editingCustomerIndex === -1) {
            // Check for duplicate name when adding a new customer
            const nameExists = customers.some(c => c.name.toLowerCase() === newName.toLowerCase());
            if (nameExists) {
                alert('A customer with this name already exists. Please use a different name or edit the existing customer.');
                if (drawerContent) drawerContent.scrollTo({ top: 0, behavior: 'smooth' });
                saveBtn.disabled = false;
                return;
            }
        }
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
    const navDashboard = document.getElementById('navDashboard');
    const dashboardSection = document.getElementById('dashboardSection');
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

    // Expenses Nav
    const navExpenses = document.getElementById('navExpenses');
    const expensesSection = document.getElementById('expensesSection');

    // Extra Profit Nav
    const navExtraProfit = document.getElementById('navExtraProfit');
    const extraProfitSection = document.getElementById('extraProfitSection');

    if (loggedInEmail !== 'jayeshmaniya18@gmail.com') {
        if (navExpenses) navExpenses.style.display = 'none';
        if (navExtraProfit) navExtraProfit.style.display = 'none';
    }
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

    if (navExpenses && expensesSection) {
        navExpenses.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            navExpenses.classList.add('active');
            navLedgerGroup.classList.remove('active');
            ledgerSubmenu.style.display = 'none';
            navTransactionsGroup.classList.remove('active');
            transactionsSubmenu.style.display = 'none';
            navReportsGroup.classList.remove('active');
            submenuReports.style.display = 'none';
            showSection(expensesSection);
            breadcrumbCurrent.textContent = 'Expenses';
            if (typeof renderExpenses === 'function') renderExpenses();
        });
    }

    if (navExtraProfit && extraProfitSection) {
        navExtraProfit.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            navExtraProfit.classList.add('active');
            navLedgerGroup.classList.remove('active');
            ledgerSubmenu.style.display = 'none';
            navTransactionsGroup.classList.remove('active');
            transactionsSubmenu.style.display = 'none';
            navReportsGroup.classList.remove('active');
            submenuReports.style.display = 'none';
            showSection(extraProfitSection);
            breadcrumbCurrent.textContent = 'Extra Profit';
            if (typeof renderExtraProfit === 'function') renderExtraProfit();
        });
    }

    const navUdhar = document.getElementById('navUdhar');
    const udharSection = document.getElementById('udharSection');

    if (navUdhar && udharSection) {
        navUdhar.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            navUdhar.classList.add('active');
            navLedgerGroup.classList.remove('active');
            ledgerSubmenu.style.display = 'none';
            navTransactionsGroup.classList.remove('active');
            transactionsSubmenu.style.display = 'none';
            navReportsGroup.classList.remove('active');
            submenuReports.style.display = 'none';
            showSection(udharSection);
            breadcrumbCurrent.textContent = 'Accounts Receivable';
            if (typeof renderUdhar === 'function') renderUdhar();
        });
    }

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
            const bankLogoHtml = typeof getBankLogo !== 'undefined' ? getBankLogo(c.bank) : '';

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
          
          <div style="z-index: 1; margin-top: 12px; font-family: monospace; font-size: 1.1rem; letter-spacing: 2px; color: #1e1b4b;">
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



    if (navDashboard && dashboardSection) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            navDashboard.classList.add('active');
            showSection(dashboardSection);
            breadcrumbCurrent.textContent = 'Dashboard';
            renderDashboard();
        });
    }

    navCustomers.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
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
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
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
            const paid = tx.raw.payments ? tx.raw.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) : 0;

            const pendingAmount = Math.max(0, bill - paid);

            let stat = 'Pending';
            let statCol = '#f97316';
            if (pendingAmount <= 0) {
                stat = 'Fully Debited';
                statCol = '#10b981';
                tx.isSettled = true; // Auto-migrate existing fully paid transactions to isSettled
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

        // Formatter
        const fmt = (num) => `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Financial Summary
        document.getElementById('viewTxTotalBill').textContent = fmt(billTotal);
        document.getElementById('viewTxPaymentRecv').textContent = fmt(paidTotal);
        document.getElementById('viewTxAmountDebited').textContent = fmt(debitTotal);

        const paidPct = billTotal > 0 ? Math.min(100, (paidTotal / billTotal) * 100) : 0;

        document.getElementById('viewTxPaymentBar').style.width = `${paidPct}%`;
        document.getElementById('viewTxPaymentPct').textContent = `${paidPct.toFixed(1)}% of bill amount`;

        document.getElementById('viewTxPendingBill').textContent = fmt(pendingBill);
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
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #6366f1;">${fmt(pAmt)}</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #6b7280;">-</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #ef4444;">₹0.00</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #16a34a;">${fmt(pAmt)}</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #6b7280;">${p.desc || '-'}</td>
            <td style="padding: 16px; text-align: center;">
              <button onclick="actionEdit(${idx})" style="background: none; border: none; cursor: pointer; color: #6366f1; margin-right: 12px;" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
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
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #6366f1;">${fmt(dAmt)}</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #6b7280;">${dRate.toFixed(2)}%</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #ef4444;">${fmt(dChg)}</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #16a34a;">${fmt(dProf)}</td>
            <td style="padding: 16px; font-size: 0.9rem; font-weight: 500; color: #16a34a;">${dMargin.toFixed(2)}%</td>
            <td style="padding: 16px; font-size: 0.9rem; color: #6b7280;">${d.desc || '-'}</td>
            <td style="padding: 16px; text-align: center;">
              <button onclick="actionEdit(${idx})" style="background: none; border: none; cursor: pointer; color: #6366f1; margin-right: 12px;" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
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

            if (typeof currentWizardStep !== 'undefined') currentWizardStep = 1;
            if (typeof renderWizardPayments === 'function') renderWizardPayments();
            if (typeof renderWizardDebits === 'function') renderWizardDebits();
            if (typeof updateWizardUI === 'function') updateWizardUI();

            wCustomer.value = String(custIdx);
            const event = new Event('change');
            wCustomer.dispatchEvent(event);
            wCard.value = String(cardIdx);

            // Fix flex to block just in case
            document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
            document.getElementById('wizardSection').style.display = 'flex';
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

        try {
            populateWizardCustomers();
            const sortedCustArray = [...customers].sort((a, b) => a.name.localeCompare(b.name));
            const currentSortedIdx = sortedCustArray.findIndex(c => c.name === tx.customerName);
            wizardCustomer.value = currentSortedIdx >= 0 ? currentSortedIdx : tx.raw.custIndex;
            wizardCard.innerHTML = '<option value="" disabled selected hidden></option>';
            const customer = currentSortedIdx >= 0 ? sortedCustArray[currentSortedIdx] : sortedCustArray[tx.raw.custIndex];
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
            showSection(document.getElementById('wizardSection'));
            breadcrumbCurrent.textContent = 'Transaction Bills / Edit Entry';
        } catch (e) {
            console.error(e);
            alert('Error editing transaction: ' + e.message);
        }
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
            portalBalancesSection.style.display = 'flex';
        });
    }

    window.showPortalDetails = (portalName) => {
        portalBalancesSection.style.display = 'none';
        portalDetailSection.style.display = 'flex';
        document.getElementById('breadcrumbCurrent').textContent = `Portal Balances / ${portalName}`;

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
                        const fee = amt * (parseFloat(d.portalPercent) || 0) / 100;
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
            <div style="font-weight: 600; font-size: 0.85rem; color: #1e1b4b;">${impact.dateStr}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${impact.timeStr}</div>
          </td>
          <td style="padding: 16px;">
            <div style="font-weight: 500; font-size: 0.85rem; color: #1e1b4b; margin-bottom: 4px;">${impact.desc}</div>
            ${detailBadge}
          </td>
          <td style="padding: 16px;">
            <div style="font-weight: 600; font-size: 0.85rem; color: #1e1b4b;">${impact.partyInfo}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${impact.bankInfo}</div>
          </td>
          <td style="padding: 16px;">${typeBadge}</td>
          <td style="padding: 16px; text-align: right; color: #ef4444; font-weight: 500; font-size: 0.85rem;">
            ${impact.debitAmt !== null ? '₹' + formatMoney(impact.debitAmt) : '-'}
          </td>
          <td style="padding: 16px; text-align: right; color: #16a34a; font-weight: 500; font-size: 0.85rem;">
            ${impact.creditAmt !== null ? '₹' + formatMoney(impact.creditAmt) : '-'}
          </td>
          <td style="padding: 16px; text-align: right; font-weight: 700; color: #1e1b4b; font-size: 0.85rem;">
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
        const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#f43f5e', '#84cc16'];

        const blacklist = ['cash', 'system reconciliation', 'bank', 'unassigned'];

        transactions.forEach(tx => {
            if (tx.raw && tx.raw.debits) {
                tx.raw.debits.forEach(d => {
                    const portalName = d.portal || 'Unassigned';
                    if (blacklist.includes(portalName.toLowerCase().trim())) {
                        return;
                    }
                    if (!portalsMap[portalName]) {
                        portalsMap[portalName] = { balance: 0, txCount: 0 };
                    }
                    const amt = parseFloat(d.amount) || 0;
                    const portalFee = amt * (parseFloat(d.portalPercent) || 0) / 100;
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
                    if (blacklist.includes(portalName.toLowerCase().trim())) {
                        return;
                    }
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
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e1b4b; text-transform: uppercase;">${pName}</h4>
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

    window.showToast = (message, type = 'success') => {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        let color, bgColor, typeLabel;

        if (type === 'success') {
            color = '#10b981';
            bgColor = '#ecfdf5';
            typeLabel = 'Success';
        } else if (type === 'warning') {
            color = '#f59e0b';
            bgColor = '#fffbeb';
            typeLabel = 'Warning';
        } else if (type === 'notice') {
            color = '#6366f1';
            bgColor = '#eef2ff';
            typeLabel = 'Notice';
        } else {
            color = '#ef4444';
            bgColor = '#fef2f2';
            typeLabel = 'Error';
        }

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
            : type === 'warning'
                ? `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" width="20" height="20"><path d="M12 9v2m0 4v2m7.07-10.07a10 10 0 1 0-14.14 0"></path><path d="M12 3v3m6.364 2.636l-2.121-2.121M21 12h-3m-6 9v-3m6.364-2.636l-2.121 2.121"></path></svg>`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

        toast.innerHTML = `
      ${icon}
      <div style="flex: 1;">
        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #1e1b4b;">${typeLabel}</h4>
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
            settlementPortalsMap = {};
            const blacklist = ['cash', 'system reconciliation', 'bank', 'unassigned'];

            // Calculate current balances
            transactions.forEach(tx => {
                if (tx.raw && tx.raw.debits) {
                    tx.raw.debits.forEach(d => {
                        const pName = d.portal || 'Unassigned';
                        if (blacklist.includes(pName.toLowerCase().trim())) {
                            return;
                        }
                        if (!settlementPortalsMap[pName]) settlementPortalsMap[pName] = 0;
                        const amt = parseFloat(d.amount) || 0;
                        const fee = amt * (parseFloat(d.portalPercent) || 0) / 100;
                        settlementPortalsMap[pName] += (amt - fee);
                    });
                }
                if (tx.raw && tx.raw.payments) {
                    tx.raw.payments.forEach(p => {
                        const pName = p.portal || 'Unassigned';
                        if (blacklist.includes(pName.toLowerCase().trim())) {
                            return;
                        }
                        if (!settlementPortalsMap[pName]) settlementPortalsMap[pName] = 0;
                        settlementPortalsMap[pName] -= (parseFloat(p.amount) || 0);
                    });
                }
            });

            // Filter non-zero portals
            const nonZeroPortals = Object.keys(settlementPortalsMap).filter(p => Math.abs(settlementPortalsMap[p]) > 0.01);

            if (nonZeroPortals.length === 0) {
                showToast('All portals are already settled (Balance is ₹0).', 'notice');
                return;
            }

            let html = `
        <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 24px;">The following portals have pending balances. Confirming will create settlement entries to zero out these balances.</p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
      `;

            nonZeroPortals.forEach(pName => {
                const bal = settlementPortalsMap[pName];
                const isPositive = bal > 0;
                const color = isPositive ? '#10b981' : '#ef4444';
                const actionText = isPositive ? 'Portal pays you' : 'You pay portal';

                html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
            <div>
              <h4 style="margin: 0 0 4px 0; font-size: 1rem; color: #1e1b4b; text-transform: uppercase;">${pName}</h4>
              <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">Action: ${actionText}</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: ${color};">${bal < 0 ? '-' : ''}₹${formatMoney(Math.abs(bal))}</h3>
              <p style="margin: 0; font-size: 0.7rem; color: #9ca3af;">Will settle to ₹0.00</p>
            </div>
          </div>
        `;
            });

            html += `</div>`;

            if (settlementModalBody) {
                settlementModalBody.innerHTML = html;
                settlementModal.style.display = 'flex';
            }
        });
    }

    if (confirmSettlementBtn) {
        confirmSettlementBtn.addEventListener('click', () => {
            const nonZeroPortals = Object.keys(settlementPortalsMap).filter(p => Math.abs(settlementPortalsMap[p]) > 0.01);
            if (nonZeroPortals.length === 0) {
                hideSettlementModal();
                return;
            }

            const today = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

            // Create a settlement transaction bill for each portal to keep things clean
            nonZeroPortals.forEach(pName => {
                const bal = settlementPortalsMap[pName];

                let settlementDebits = [];
                let settlementPayments = [];

                if (bal > 0) {
                    // Add a Payment to reduce balance by bal
                    settlementPayments.push({
                        id: 'set_' + Date.now() + Math.random().toString(36).substr(2, 5),
                        amount: bal.toFixed(2),
                        portal: pName
                    });
                } else if (bal < 0) {
                    // Add a Debit to increase balance by abs(bal)
                    settlementDebits.push({
                        id: 'set_' + Date.now() + Math.random().toString(36).substr(2, 5),
                        amount: Math.abs(bal).toFixed(2),
                        charges: '0',
                        portal: pName,
                        feePercentage: 0
                    });
                }

                const settlementTx = {
                    id: 'SETTLEMENT_' + Date.now() + Math.random().toString(36).substr(2, 9),
                    date: today,
                    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    customerName: 'Settlement Account',
                    customerPhone: '-',
                    bank: 'System',
                    cardSuffix: '0000',
                    bill: 'System',
                    baseAmount: Math.abs(bal).toFixed(2),
                    customerFee: 0,
                    portalFee: 0,
                    profit: 0,
                    status: 'Fully Debited',
                    raw: {
                        debits: settlementDebits,
                        payments: settlementPayments
                    },
                    isSettlement: true
                };

                transactions.push(settlementTx);
            });

            localStorage.setItem('cardbills_transactions', JSON.stringify(transactions));

            hideSettlementModal();
            renderPortalBalances();
            renderAllTransactions();
            renderTransactions();

            showToast(`Successfully settled ${nonZeroPortals.length} portal(s).`);
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
            const allConfiguredPortals = (JSON.parse(localStorage.getItem('cardbills_portals')) || []).map(p => p.name);
            [...new Set([...allConfiguredPortals, ...portalSet])].filter(Boolean).sort().forEach(p => {
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

        const totalPages = Math.ceil(filteredTx.length / ITEMS_PER_PAGE) || 1;
        if (currentAllTxPage > totalPages) currentAllTxPage = totalPages;
        if (currentAllTxPage < 1) currentAllTxPage = 1;

        const startIdx = (currentAllTxPage - 1) * ITEMS_PER_PAGE;
        const pagedTx = filteredTx.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        ledgerListBody.innerHTML = '';
        if (pagedTx.length === 0) {
            ledgerListBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #6b7280;">No transactions found.</td></tr>';
            return;
        }

        pagedTx.forEach(tx => {
            const tr = document.createElement('tr');
            if (typeof tx.originalTxIndex !== 'undefined') {
                tr.style.cursor = 'pointer';
                tr.style.transition = 'background-color 0.2s';
                tr.onmouseover = () => tr.style.backgroundColor = '#f1f5f9';
                tr.onmouseout = () => tr.style.backgroundColor = '';
                tr.onclick = () => { if (typeof actionEdit === 'function') { document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); document.getElementById('nav-transactions').classList.add('active'); showSection(document.getElementById('transactionsSection')); actionEdit(tx.originalTxIndex); } };
            }
            const isCredit = tx.type === 'Credit';
            const typeBadge = isCredit ? `<span style="border: 1px solid #c4b5fd; color: #6366f1; background-color: #eef2ff; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Bill Debit</span>`
                : `<span style="border: 1px solid #c4b5fd; color: #6366f1; background-color: #eef2ff; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Bill Payment</span>`;
            const title = isCredit ? 'Customer Debit - Card Debit' : 'Bill Payment - Credit Card Bill';
            const desc = isCredit ? `Customer Debited: ₹${formatMoney(tx.baseAmount)}` : '';
            const impactColor = isCredit ? '#10b981' : '#ef4444';
            const impactSign = isCredit ? '+' : '';

            let chargesHtml = '';
            if (isCredit) {
                chargesHtml = `
          <div style="color: #f59e0b; font-weight: 600;">₹${formatMoney(tx.portalFee)}</div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 2px;">Portal Fee</div>
          <div style="color: #6366f1; font-weight: 600;">₹${formatMoney(tx.customerFee)}</div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 4px;">Customer Fee</div>
          <span style="border: 1px solid #fbd38d; color: #f59e0b; padding: 2px 8px; border-radius: 12px; font-size: 0.6rem; font-weight: 600; text-transform: uppercase;">${tx.chargesStatus}</span>
        `;
            } else {
                chargesHtml = `<div style="color: #6b7280; font-size: 0.85rem; padding-top: 10px;">No charges</div>`;
            }

            tr.innerHTML = `
        <td style="vertical-align: top; padding: 16px;">
          <div style="color: #1e1b4b; font-weight: 500;">${new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</div>
          <div style="color: #6b7280; font-size: 0.85rem;">${tx.timeStr}</div>
        </td>
        <td style="vertical-align: top; padding: 16px;">
          <div style="margin-bottom: 6px;">${typeBadge}</div>
          <div style="color: #1e1b4b; font-weight: 500; font-size: 0.95rem;">${title}</div>
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

        // Pagination UI Update
        const prevBtn = document.getElementById('btnPrevAllTx');
        const nextBtn = document.getElementById('btnNextAllTx');
        const pageText = document.getElementById('pageTextAllTx');

        if (pageText) pageText.textContent = `Page ${currentAllTxPage} of ${totalPages}`;
        if (prevBtn) {
            prevBtn.disabled = currentAllTxPage === 1;
            prevBtn.onclick = () => { if (currentAllTxPage > 1) { currentAllTxPage--; renderAllTransactions(); } };
        }
        if (nextBtn) {
            nextBtn.disabled = currentAllTxPage === totalPages;
            nextBtn.onclick = () => { if (currentAllTxPage < totalPages) { currentAllTxPage++; renderAllTransactions(); } };
        }
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
            activeBtn.style.backgroundColor = '#6366f1';
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

        let filtered = transactions.map((tx, originalIndex) => ({ tx, originalIndex })).filter(item => {
            const tx = item.tx;
            if (tx.isSettlement) return false;
            if (status !== 'All Status' && tx.status !== status) return false;

            if (query) {
                const searchStr = `${tx.customerName} ${tx.customerPhone} ${tx.bank} ${tx.cardSuffix} ${tx.bill} ${tx.date}`.toLowerCase();
                if (!searchStr.includes(query)) return false;
            }
            return true;
        });

        // Sort by date+time descending (latest first)
        filtered.sort((a, b) => {
            const aDate = new Date(`${a.tx.date} ${a.tx.time || '00:00'}`).getTime() || 0;
            const bDate = new Date(`${b.tx.date} ${b.tx.time || '00:00'}`).getTime() || 0;
            return bDate - aDate;
        });

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
        if (currentTxPage > totalPages) currentTxPage = totalPages;
        if (currentTxPage < 1) currentTxPage = 1;

        const startIdx = (currentTxPage - 1) * ITEMS_PER_PAGE;
        const paged = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        paged.forEach(item => {
            const tx = item.tx;
            const index = item.originalIndex;

            let _totalCharges = 0;
            let _totalProfit = 0;
            if (tx.raw && tx.raw.debits && tx.raw.debits.length > 0) {
                tx.raw.debits.forEach(d => {
                    const _amt = parseFloat(d.amount) || 0;
                    const _customerFee = parseFloat(d.charges) || (_amt * (parseFloat(d.ratePercent) || 0) / 100);
                    const _portalFee = _amt * (parseFloat(d.portalPercent) || 0) / 100;
                    _totalCharges += _customerFee;
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
          <span class="text-muted" style="font-size: 0.75rem;">${tx.customerPhone}</span>
        </div>
      </td>
      <td>
        <div class="detail-line">
          <span style="font-weight: 500; color: #4f46e5; font-size: 0.85rem;">${tx.bank} ••••${tx.cardSuffix}</span>
        </div>
      </td>
      <td>
        <div class="detail-line">
          ${(() => {
                    const billAmt = parseFloat((tx.raw && tx.raw.billTotal) ? tx.raw.billTotal : (tx.bill || 0)) || 0;
                    const paidAmt = tx.raw && tx.raw.payments ? tx.raw.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) : 0;
                    const debitAmt = tx.raw && tx.raw.debits ? tx.raw.debits.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0) : 0;
                    let pendingAmt = Math.max(0, billAmt - paidAmt) + Math.max(0, paidAmt - debitAmt);
                    if (tx.isSettled) pendingAmt = 0;
                    return `
              <div style="display:flex;flex-direction:column;gap:2px;font-size:0.8rem;">
                <div style="display:flex;justify-content:space-between;gap:12px;">
                  <span style="color:#6b7280;">Bill:</span>
                  <span style="font-weight:600;color:#111827;">₹${billAmt.toLocaleString('en-IN')}</span>
                </div>
                <div style="display:flex;justify-content:space-between;gap:12px;">
                  <span style="color:#6b7280;">Paid:</span>
                  <span style="font-weight:600;color:#10b981;">₹${paidAmt.toLocaleString('en-IN')}</span>
                </div>
                <div style="display:flex;justify-content:space-between;gap:12px;">
                  <span style="color:#6b7280;">Pending:</span>
                  <span style="font-weight:600;color:${pendingAmt > 0 ? '#f97316' : '#10b981'};">₹${pendingAmt.toLocaleString('en-IN')}</span>
                </div>
              </div>
            `;
                })()}
        </div>
      </td>
      <td>
        ${(() => {
                    const bAmt = parseFloat((tx.raw && tx.raw.billTotal) ? tx.raw.billTotal : (tx.bill || 0)) || 0;
                    const pAmt = tx.raw && tx.raw.payments ? tx.raw.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) : 0;
                    const dAmt = tx.raw && tx.raw.debits ? tx.raw.debits.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0) : 0;
                    let currentPending = Math.max(0, bAmt - pAmt) + Math.max(0, pAmt - dAmt);
                    if (tx.isSettled) currentPending = 0;
                    return `<span style="font-weight: 600; color: ${currentPending > 0 ? '#f97316' : '#10b981'};">
            ₹${currentPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>`;
                })()}
      </td>
      <td>
        ${(() => {
                    const bAmt = parseFloat((tx.raw && tx.raw.billTotal) ? tx.raw.billTotal : (tx.bill || 0)) || 0;
                    const pAmt = tx.raw && tx.raw.payments ? tx.raw.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) : 0;
                    const dAmt = tx.raw && tx.raw.debits ? tx.raw.debits.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0) : 0;
                    let customerPending = Math.max(0, bAmt - pAmt) + Math.max(0, pAmt - dAmt);
                    if (tx.isSettled) customerPending = 0;

                    let currentStatus = customerPending <= 0 ? 'Fully Debited' : 'Pending';

                    let bg, color, border, dot;
                    if (currentStatus === 'Fully Debited') {
                        bg = '#f0fdf4'; color = '#16a34a'; border = '#bbf7d0'; dot = '#22c55e';
                    } else {
                        bg = '#fff7ed'; color = '#ea580c'; border = '#fed7aa'; dot = '#f97316';
                    }

                    return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;background:${bg};border:1px solid ${border};font-size:0.78rem;font-weight:600;color:${color};">
            <span style="width:7px;height:7px;border-radius:50%;background:${dot};display:inline-block;"></span>
            ${currentStatus}
          </span>`;
                })()}
      </td>
      <td>
        <div class="detail-line">
          <span style="color: ${_profitColor}; font-weight: 600; font-size: 0.85rem;">${_profitStr} Profit</span>
          <span class="text-muted" style="font-size: 0.75rem;">${_chargesStr} Charges</span>
        </div>
      </td>
      <td>
        <div class="actions">
          <svg onclick="actionInvoice(${index})" class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <svg onclick="actionEdit(${index})" class="action-icon edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <svg onclick="actionDelete(${index})" class="action-icon delete" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </div>
      </td>
    `;
            transactionListBody.appendChild(tr);
        });

        // Pagination UI Update
        const prevBtn = document.getElementById('btnPrevTx');
        const nextBtn = document.getElementById('btnNextTx');
        const pageText = document.getElementById('pageTextTx');

        if (pageText) pageText.textContent = `Page ${currentTxPage} of ${totalPages}`;
        if (prevBtn) {
            prevBtn.disabled = currentTxPage === 1;
            prevBtn.onclick = () => { if (currentTxPage > 1) { currentTxPage--; renderTransactions(); } };
        }
        if (nextBtn) {
            nextBtn.disabled = currentTxPage === totalPages;
            nextBtn.onclick = () => { if (currentTxPage < totalPages) { currentTxPage++; renderTransactions(); } };
        }
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
    // savedPortals is now global: window.savedPortals, updated by updateSavedPortalsArray()

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
        if (typeof currentPortals !== 'undefined') {
            const pInfo = currentPortals.find(p => p.name === portal);
            if (pInfo) {
                wizardPayments[idx].portalPercent = pInfo.portalPercent || '';
                wizardPayments[idx].customerPercent = pInfo.customerPercent || '';
            }
        }
        document.getElementById(`portal-dropdown-${idx}`).style.display = 'none';
        renderWizardPayments();
    };

    window.addNewPortal = (idx) => {
        // Close any open dropdowns
        document.querySelectorAll('.portal-options-container').forEach(el => el.style.display = 'none');
        // Track which wizard row triggered the modal
        window._pendingPortalWizardIdx = idx;
        window._pendingPortalWizardType = 'payment';
        // Open the Settings portal modal
        window.openAddPortalModal();
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
            <div onclick="togglePortalDropdown(${idx})" style="border: 1px solid ${!p.portal ? '#6366f1' : '#d1d5db'}; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: ${!p.portal ? '#9ca3af' : '#374151'}; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
              <span>${p.portal || 'Select'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div id="portal-dropdown-${idx}" class="portal-options-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); z-index: 50; max-height: 250px; overflow-y: auto; margin-top: 4px;">
              ${(window.savedPortals || []).map(portal => `
                <div onclick="selectPortal(${idx}, '${portal}')" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">${portal}</div>
              `).join('')}
              <div onclick="addNewPortal(${idx})" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #6366f1; font-weight: 500; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f5f3ff'" onmouseout="this.style.background='white'">
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
              <div onclick="toggleDebitPortalDropdown(${idx})" style="border: 1px solid ${!d.portal ? '#6366f1' : '#d1d5db'}; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: ${!d.portal ? '#9ca3af' : '#374151'}; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
                <span>${d.portal || 'Select'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div id="debit-portal-dropdown-${idx}" class="portal-options-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); z-index: 50; max-height: 250px; overflow-y: auto; margin-top: 4px;">
                ${(window.savedPortals || []).map(portal => `
                  <div onclick="selectDebitPortal(${idx}, '${portal}')" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">${portal}</div>
                `).join('')}
                <div onclick="addNewDebitPortal(${idx})" style="padding: 10px 16px; cursor: pointer; font-size: 0.9rem; color: #6366f1; font-weight: 500; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f5f3ff'" onmouseout="this.style.background='white'">
                   + Add New Portal
                </div>
              </div>
            </div>
            
            <div class="form-group" style="flex: 1; position: relative; margin-bottom: 0;">
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6b7280; z-index: 1;">Portal %</label>
              <div class="input-with-icon" style="border-radius: 8px; border-color: #d1d5db; display: flex; justify-content: space-between; align-items: center;">
                <input type="number" id="debit-portalPercent-${idx}" oninput="updateWizardDebit(${idx}, 'portalPercent', this.value)" value="${d.portalPercent}" style="border: none; outline: none; padding: 10px 0; padding-left: 12px; font-size: 0.9rem; width: 80%;">
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
              <label style="position: absolute; top: -8px; left: 12px; background: white; padding: 0 4px; font-size: 0.75rem; color: #6366f1; z-index: 1;">Charges Status</label>
              <div onclick="toggleChargesDropdown(${idx})" style="border: 1px solid #6366f1; border-radius: 8px; padding: 10px 16px; font-size: 0.9rem; color: #374151; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 42px;">
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

        // Auto-calculate Charges based on Rate % & Amount
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
        // Auto-calculate Rate % based on Charges & Amount
        else if (field === 'charges') {
            const amt = parseFloat(wizardDebits[idx].amount) || 0;
            const charges = parseFloat(wizardDebits[idx].charges) || 0;
            if (amt > 0 && charges >= 0) {
                const rate = ((charges / amt) * 100).toFixed(2);
                wizardDebits[idx].ratePercent = rate;
                const ratePercentInput = document.getElementById('debit-rate-' + idx);
                if (ratePercentInput) ratePercentInput.value = rate;
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
        if (typeof currentPortals !== 'undefined') {
            const pInfo = currentPortals.find(p => p.name === portal);
            if (pInfo) {
                wizardDebits[idx].portalPercent = pInfo.portalPercent || '';
                wizardDebits[idx].ratePercent = pInfo.customerPercent || '';

                // Auto-calculate charges if amount is already entered
                const amt = parseFloat(wizardDebits[idx].amount) || 0;
                const cRate = parseFloat(pInfo.customerPercent) || 0;
                if (amt > 0 && cRate > 0) {
                    wizardDebits[idx].charges = (amt * cRate / 100).toFixed(2);
                }
            }
        }
        document.getElementById(`debit-portal-dropdown-${idx}`).style.display = 'none';
        renderWizardDebits();
    };
    window.addNewDebitPortal = (idx) => {
        // Close any open dropdowns
        document.querySelectorAll('.portal-options-container').forEach(el => el.style.display = 'none');
        // Track which wizard row triggered the modal
        window._pendingPortalWizardIdx = idx;
        window._pendingPortalWizardType = 'debit';
        // Open the Settings portal modal
        window.openAddPortalModal();
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
        const pending = Math.max(0, bill - paid);

        document.getElementById('paymentSummaryTotal').textContent = `₹${bill.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('paymentSummaryPaid').textContent = `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('paymentSummaryPending').textContent = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        document.getElementById('debitSummaryTotal').textContent = `₹${bill.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('debitSummaryDebited').textContent = `₹${debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('debitSummaryPending').textContent = `₹${Math.max(0, bill - debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        if (currentWizardStep === 4) {
            const custIndex = wizardCustomer.value;
            const cardIndex = wizardCard.value;
            if (custIndex === '' || cardIndex === '') return;
            const customer = [...customers].sort((a, b) => a.name.localeCompare(b.name))[custIndex];
            const card = customer && customer.cards ? customer.cards[cardIndex] : null;
            if (!customer || !card) return;

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
        currentWizardStep = 1;
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
            showSection(transactionsSection);
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
    if (searchInput) searchInput.addEventListener('input', () => { window.currentTxPage = 1; renderTransactions(); });
    if (statusFilter) statusFilter.addEventListener('change', () => { window.currentTxPage = 1; renderTransactions(); });


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

    if (glAddEntryBtnTop) glAddEntryBtnTop.addEventListener('click', goToAddEntry);
    if (glAddEntryBtnEmpty) glAddEntryBtnEmpty.addEventListener('click', goToAddEntry);

    if (glCancelBtn) {
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
          <div style="font-weight: 500; color: #1e1b4b;">${formattedDate}</div>
        </td>
        <td>
          <div style="font-weight: 500; color: #1e1b4b;">${e.type}</div>
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

    if (glSearchInput) glSearchInput.addEventListener('input', () => { window.currentLedgerPage = 1; renderLedgerEntries(); });
    if (glCustomerFilter) glCustomerFilter.addEventListener('change', () => { window.currentLedgerPage = 1; renderLedgerEntries(); });
    if (glTypeFilter) glTypeFilter.addEventListener('change', () => { window.currentLedgerPage = 1; renderLedgerEntries(); });

    // ==========================================
    // Expenses Logic
    // ==========================================
    let cardbills_expenses = JSON.parse(localStorage.getItem('cardbills_expenses')) || [];
    const expensesTotalValue = document.getElementById('expensesTotalValue');
    const expensesForm = document.getElementById('expensesForm');
    const expensesTableBody = document.getElementById('expensesTableBody');
    const expenseName = document.getElementById('expenseName');
    const expenseAmount = document.getElementById('expenseAmount');
    const expenseDate = document.getElementById('expenseDate');
    const openAddExpenseModalBtn = document.getElementById('openAddExpenseModalBtn');
    const addExpenseModal = document.getElementById('addExpenseModal');
    const closeAddExpenseModal = document.getElementById('closeAddExpenseModal');
    const cancelAddExpenseBtn = document.getElementById('cancelAddExpenseBtn');

    window.renderExpenses = () => {
        if (!expensesTableBody) return;
        expensesTableBody.innerHTML = '';
        let totalExpenses = 0;
        let totalProfit = 0;

        const now = new Date();
        let filterStart = null;
        let filterEnd = null;

        if (currentExpenseFilter === 'today') {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filterStart = d.getTime();
            filterEnd = d.getTime() + 86399999;
        } else if (currentExpenseFilter === 'monthly') {
            const y = now.getFullYear();
            const m = now.getMonth();
            filterStart = new Date(y, m, 1).getTime();
            filterEnd = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
        } else if (currentExpenseFilter === 'yearly') {
            const y = now.getFullYear();
            filterStart = new Date(y, 0, 1).getTime();
            filterEnd = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
        } else if (currentExpenseFilter === 'custom') {
            const startInput = document.getElementById('expStartDate').value;
            const endInput = document.getElementById('expEndDate').value;
            if (startInput) filterStart = new Date(startInput).getTime();
            if (endInput) filterEnd = new Date(endInput).getTime() + 86399999;
        }

        const passesFilter = (dateStr) => {
            if (filterStart === null && filterEnd === null) return true;
            let time = new Date(dateStr).getTime();
            if (isNaN(time) && dateStr) {
                const parts = dateStr.split(/[-/]/);
                if (parts.length === 3) {
                    const p1 = parseInt(parts[0], 10);
                    const p2 = parseInt(parts[1], 10);
                    const p3 = parseInt(parts[2], 10);
                    if (p3 > 2000) {
                        if (p2 > 12) time = new Date(p3, p1 - 1, p2).getTime();
                        else time = new Date(p3, p2 - 1, p1).getTime();
                    }
                }
            }
            if (!isNaN(time)) {
                if (filterStart !== null && time < filterStart) return false;
                if (filterEnd !== null && time > filterEnd) return false;
            }
            return true;
        };

        // Filter and render expenses
        const filteredExpenses = cardbills_expenses.filter(exp => passesFilter(exp.date));
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredExpenses.forEach((exp) => {
            totalExpenses += parseFloat(exp.amount) || 0;
        });

        const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE) || 1;
        if (currentExpensesPage > totalPages) currentExpensesPage = totalPages;
        if (currentExpensesPage < 1) currentExpensesPage = 1;

        const startIdx = (currentExpensesPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const paginatedExpenses = filteredExpenses.slice(startIdx, endIdx);

        paginatedExpenses.forEach((exp) => {
            const originalIdx = cardbills_expenses.indexOf(exp);

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e5e7eb';
            tr.innerHTML = `
                <td style="padding: 12px 16px;">${new Date(exp.date).toLocaleDateString('en-GB')}</td>
                <td style="padding: 12px 16px;">${exp.name}</td>
                <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #ef4444;">₹ ${formatMoney(exp.amount)}</td>
                <td style="padding: 12px 16px; text-align: center;">
                    <button onclick="deleteExpense(${originalIdx})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Delete Expense">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            `;
            expensesTableBody.appendChild(tr);
        });

        if (filteredExpenses.length === 0) {
            expensesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: #6b7280;">No expenses recorded yet.</td></tr>';
        }

        const prevBtn = document.getElementById('prevExpensesBtn');
        const nextBtn = document.getElementById('nextExpensesBtn');
        const pageIndicator = document.getElementById('expensesPageIndicator');

        if (pageIndicator) pageIndicator.textContent = `Page ${currentExpensesPage} of ${totalPages}`;

        if (prevBtn) {
            prevBtn.disabled = currentExpensesPage === 1;
            prevBtn.onclick = () => { if (currentExpensesPage > 1) { currentExpensesPage--; renderExpenses(); } };
        }
        if (nextBtn) {
            nextBtn.disabled = currentExpensesPage === totalPages;
            nextBtn.onclick = () => { if (currentExpensesPage < totalPages) { currentExpensesPage++; renderExpenses(); } };
        }

        // Calculate Profit from transactions for the same date filter
        const currentTxs = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
        let totCustCharges = 0;
        let totPortalCharges = 0;
        let txProfit = 0;

        currentTxs.forEach(t => {
            let txDateStr = t.date || t.timestamp || '';
            if (!passesFilter(txDateStr)) return;
            if (t.isSettlement || t.customerName === 'Settlement Account') return;

            if (t.raw && t.raw.debits) {
                t.raw.debits.forEach(d => {
                    let amt = parseFloat(d.amount) || 0;
                    let cFee = parseFloat(d.charges) || (amt * (parseFloat(d.ratePercent) || 0) / 100);
                    let pChg = amt * (parseFloat(d.portalPercent) || 0) / 100;
                    totCustCharges += cFee;
                    totPortalCharges += pChg;
                    txProfit += (parseFloat(d.profit) || (cFee - pChg));
                });
            }
        });

        let filteredExtraProfit = 0;
        const currentExtraProfits = JSON.parse(localStorage.getItem('cardbills_extra_profit')) || [];
        currentExtraProfits.forEach(ep => {
            let epDateStr = ep.date || '';
            if (passesFilter(epDateStr)) {
                filteredExtraProfit += parseFloat(ep.amount) || 0;
            }
        });

        totalProfit = txProfit + filteredExtraProfit;

        const expensesTotalValue = document.getElementById('expensesTotalValue');
        const expensesProfitValue = document.getElementById('expensesProfitValue');

        if (expensesTotalValue) {
            expensesTotalValue.innerHTML = `<span style="color: #fca5a5; font-size: 1.5rem;">₹</span> ${formatMoney(totalExpenses)}`;
        }
        if (expensesProfitValue) {
            expensesProfitValue.innerHTML = `<span style="color: #6ee7b7; font-size: 1.5rem;">₹</span> ${formatMoney(totalProfit)}`;
        }
    };

    if (openAddExpenseModalBtn && addExpenseModal) {
        openAddExpenseModalBtn.addEventListener('click', () => {
            expenseName.value = '';
            expenseAmount.value = '';
            expenseDate.value = new Date().toISOString().split('T')[0];
            addExpenseModal.style.display = 'flex';
        });
    }

    const closeExpenseModalFunc = () => {
        if (addExpenseModal) addExpenseModal.style.display = 'none';
    };

    if (closeAddExpenseModal) closeAddExpenseModal.addEventListener('click', closeExpenseModalFunc);
    if (cancelAddExpenseBtn) cancelAddExpenseBtn.addEventListener('click', closeExpenseModalFunc);

    if (expensesForm) {
        expensesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newExp = {
                id: 'exp_' + Date.now(),
                name: expenseName.value.trim(),
                amount: parseFloat(expenseAmount.value) || 0,
                date: expenseDate.value,
                timestamp: Date.now()
            };
            cardbills_expenses.push(newExp);
            localStorage.setItem('cardbills_expenses', JSON.stringify(cardbills_expenses));
            renderExpenses();
            showToast('Expense added successfully!');
            closeExpenseModalFunc();
        });
    }

    window.deleteExpense = (idx) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            cardbills_expenses.splice(idx, 1);
            localStorage.setItem('cardbills_expenses', JSON.stringify(cardbills_expenses));
            renderExpenses();
            showToast('Expense deleted.');
        }
    };

    // Extra Profit Logic
    // ==========================================
    let cardbills_extra_profit = JSON.parse(localStorage.getItem('cardbills_extra_profit')) || [];
    const extraProfitTotalValue = document.getElementById('extraProfitTotalValue');
    const extraProfitForm = document.getElementById('extraProfitForm');
    const extraProfitTableBody = document.getElementById('extraProfitTableBody');
    const extraProfitName = document.getElementById('extraProfitName');
    const extraProfitAmount = document.getElementById('extraProfitAmount');
    const extraProfitDate = document.getElementById('extraProfitDate');
    const openAddExtraProfitModalBtn = document.getElementById('openAddExtraProfitModalBtn');
    const addExtraProfitModal = document.getElementById('addExtraProfitModal');
    const closeAddExtraProfitModal = document.getElementById('closeAddExtraProfitModal');
    const cancelExtraProfitBtn = document.getElementById('cancelExtraProfitBtn');

    window.renderExtraProfit = () => {
        if (!extraProfitTableBody) return;
        extraProfitTableBody.innerHTML = '';
        let totalExtraProfit = 0;

        cardbills_extra_profit.sort((a, b) => new Date(b.date) - new Date(a.date));

        cardbills_extra_profit.forEach(ep => {
            totalExtraProfit += parseFloat(ep.amount) || 0;
        });

        const totalPages = Math.ceil(cardbills_extra_profit.length / ITEMS_PER_PAGE) || 1;
        if (currentExtraProfitPage > totalPages) currentExtraProfitPage = totalPages;
        if (currentExtraProfitPage < 1) currentExtraProfitPage = 1;

        const startIdx = (currentExtraProfitPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const paginatedEP = cardbills_extra_profit.slice(startIdx, endIdx);

        paginatedEP.forEach((ep) => {
            const idx = cardbills_extra_profit.indexOf(ep);

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e5e7eb';
            tr.innerHTML = `
                <td style="padding: 12px 16px;">${new Date(ep.date).toLocaleDateString('en-GB')}</td>
                <td style="padding: 12px 16px; font-weight: 500; color: #111827;">${ep.name || '-'}</td>
                <td style="padding: 12px 16px; text-align: right; color: #059669; font-weight: 600;">₹${parseFloat(ep.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style="padding: 12px 16px; text-align: center;">
                    <button onclick="deleteExtraProfit(${idx})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='transparent'">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            `;
            extraProfitTableBody.appendChild(tr);
        });

        if (cardbills_extra_profit.length === 0) {
            extraProfitTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: #6b7280;">No extra profit recorded yet.</td></tr>';
        }

        if (extraProfitTotalValue) {
            extraProfitTotalValue.innerHTML = `<span style="color: #34d399; font-size: 1.5rem;">₹</span> ${totalExtraProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }

        const prevBtn = document.getElementById('prevExtraProfitBtn');
        const nextBtn = document.getElementById('nextExtraProfitBtn');
        const pageIndicator = document.getElementById('extraProfitPageIndicator');

        if (pageIndicator) pageIndicator.textContent = `Page ${currentExtraProfitPage} of ${totalPages}`;

        if (prevBtn) {
            prevBtn.disabled = currentExtraProfitPage === 1;
            prevBtn.onclick = () => { if (currentExtraProfitPage > 1) { currentExtraProfitPage--; renderExtraProfit(); } };
        }
        if (nextBtn) {
            nextBtn.disabled = currentExtraProfitPage === totalPages;
            nextBtn.onclick = () => { if (currentExtraProfitPage < totalPages) { currentExtraProfitPage++; renderExtraProfit(); } };
        }

        // Also update dashboard if currently viewing it
        if (typeof window.updateDashboardStats === 'function') {
            window.updateDashboardStats();
        }
    };

    const closeExtraProfitModalFunc = () => {
        if (addExtraProfitModal) addExtraProfitModal.style.display = 'none';
        if (extraProfitForm) extraProfitForm.reset();
    };

    if (openAddExtraProfitModalBtn && addExtraProfitModal) {
        openAddExtraProfitModalBtn.addEventListener('click', () => {
            extraProfitName.value = '';
            extraProfitAmount.value = '';
            extraProfitDate.value = new Date().toISOString().split('T')[0];
            addExtraProfitModal.style.display = 'flex';
        });
    }

    if (closeAddExtraProfitModal) closeAddExtraProfitModal.addEventListener('click', closeExtraProfitModalFunc);
    if (cancelExtraProfitBtn) cancelExtraProfitBtn.addEventListener('click', closeExtraProfitModalFunc);

    if (extraProfitForm) {
        extraProfitForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newEp = {
                name: extraProfitName.value.trim(),
                amount: parseFloat(extraProfitAmount.value) || 0,
                date: extraProfitDate.value,
                timestamp: Date.now()
            };
            cardbills_extra_profit.push(newEp);
            localStorage.setItem('cardbills_extra_profit', JSON.stringify(cardbills_extra_profit));
            renderExtraProfit();
            showToast('Extra Profit added successfully!', 'success');
            closeExtraProfitModalFunc();
        });
    }

    window.deleteExtraProfit = (idx) => {
        if (confirm('Are you sure you want to delete this extra profit entry?')) {
            cardbills_extra_profit.splice(idx, 1);
            localStorage.setItem('cardbills_extra_profit', JSON.stringify(cardbills_extra_profit));
            renderExtraProfit();
            showToast('Extra Profit deleted.', 'info');
        }
    };

    // ==========================================
    // Udhar Logic
    // ==========================================
    let cardbills_udhar = JSON.parse(localStorage.getItem('cardbills_udhar')) || [];
    let udharNeedsSave = false;
    cardbills_udhar.forEach((u, index) => {
        if (!u.id) {
            u.id = 'udh_legacy_' + Date.now() + '_' + index;
            udharNeedsSave = true;
        }
    });
    if (udharNeedsSave) {
        localStorage.setItem('cardbills_udhar', JSON.stringify(cardbills_udhar));
    }
    const udharTotalValue = document.getElementById('udharTotalValue');
    const openAddUdharModalBtn = document.getElementById('openAddUdharModalBtn');
    const addUdharModal = document.getElementById('addUdharModal');
    const closeAddUdharModal = document.getElementById('closeAddUdharModal');
    const cancelUdharBtn = document.getElementById('cancelUdharBtn');
    const udharForm = document.getElementById('udharForm');
    const udharName = document.getElementById('udharName');
    const udharAmount = document.getElementById('udharAmount');
    const udharDate = document.getElementById('udharDate');

    // Avatar color palette
    const udharAvatarColors = [
        { bg: '#dbeafe', text: '#1d4ed8' },
        { bg: '#dcfce7', text: '#166534' },
        { bg: '#fce7f3', text: '#9d174d' },
        { bg: '#fef3c7', text: '#92400e' },
        { bg: '#ede9fe', text: '#5b21b6' },
        { bg: '#ffedd5', text: '#9a3412' },
        { bg: '#e0f2fe', text: '#0c4a6e' },
        { bg: '#f3e8ff', text: '#7e22ce' },
    ];

    let editUdharId = null;

    window.renderUdhar = () => {
        const udharGrid = document.getElementById('udharGrid');
        if (!udharGrid) return;
        udharGrid.innerHTML = '';
        let totalUdhar = 0;

        const groupsMap = {};
        cardbills_udhar.forEach(u => {
            const amt = parseFloat(u.amount) || 0;
            totalUdhar += amt;
            const key = (u.name || 'Unknown').trim().toLowerCase();
            if (!groupsMap[key]) {
                groupsMap[key] = {
                    name: u.name || 'Unknown',
                    totalAmount: 0,
                    count: 0,
                    lastDate: u.date
                };
            }
            groupsMap[key].totalAmount += amt;
            groupsMap[key].count += 1;
            if (new Date(u.date) > new Date(groupsMap[key].lastDate)) {
                groupsMap[key].lastDate = u.date;
            }
        });

        const groupedList = Object.values(groupsMap).sort((a, b) => b.totalAmount - a.totalAmount);

        const totalPages = Math.ceil(groupedList.length / ITEMS_PER_PAGE) || 1;
        if (currentUdharPage > totalPages) currentUdharPage = totalPages;
        if (currentUdharPage < 1) currentUdharPage = 1;

        const startIdx = (currentUdharPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const paginatedGroups = groupedList.slice(startIdx, endIdx);

        if (groupedList.length === 0) {
            udharGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#6b7280;font-size:1rem;">No receivable entries yet.</div>';
        }

        paginatedGroups.forEach((group) => {
            const name = group.name;
            const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            const colorSet = udharAvatarColors[(name.charCodeAt(0) || 0) % udharAvatarColors.length];
            const amount = parseFloat(group.totalAmount || 0);
            const dateStr = new Date(group.lastDate).toLocaleDateString('en-GB');

            const card = document.createElement('div');
            card.style.cssText = 'background: white; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); border: 1px solid #f3f4f6; overflow: hidden; display: flex; flex-direction: column; transition: box-shadow 0.2s, transform 0.2s; cursor: pointer;';
            card.onmouseover = () => { card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; card.style.transform = 'translateY(-2px)'; };
            card.onmouseout = () => { card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; card.style.transform = 'translateY(0)'; };
            card.onclick = () => openUdharDetails(name);
            
            card.innerHTML = `
                <div style="padding: 16px 20px; display: flex; align-items: center; gap: 14px; border-bottom: 1px solid #f3f4f6;">
                    <div style="width: 46px; height: 46px; border-radius: 50%; background: ${colorSet.bg}; color: ${colorSet.text}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; letter-spacing: 0.5px;">
                        ${initials}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 700; color: #1e1b4b; font-size: 0.98rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name.toUpperCase()}</div>
                        <div style="color: #9ca3af; font-size: 0.78rem; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Last entry: ${dateStr} &bull; ${group.count} ${group.count === 1 ? 'entry' : 'entries'}
                        </div>
                    </div>
                </div>
                <div style="padding: 16px 20px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); text-align: center;">
                    <div style="font-size: 0.72rem; color: #d97706; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Total Receivable</div>
                    <div style="font-size: 1.6rem; font-weight: 800; color: #b45309;">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
            `;
            udharGrid.appendChild(card);
        });

        if (udharTotalValue) {
            udharTotalValue.innerHTML = `<span style="color: #fbbf24; font-size: 1.5rem;">₹</span> ${totalUdhar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }

        const prevBtn = document.getElementById('prevUdharBtn');
        const nextBtn = document.getElementById('nextUdharBtn');
        const pageIndicator = document.getElementById('udharPageIndicator');

        if (pageIndicator) pageIndicator.textContent = `Page ${currentUdharPage} of ${totalPages}`;

        if (prevBtn) {
            prevBtn.disabled = currentUdharPage === 1;
            prevBtn.onclick = () => { if (currentUdharPage > 1) { currentUdharPage--; renderUdhar(); } };
        }
        if (nextBtn) {
            nextBtn.disabled = currentUdharPage === totalPages;
            nextBtn.onclick = () => { if (currentUdharPage < totalPages) { currentUdharPage++; renderUdhar(); } };
        }
    };

    window.openUdharDetails = (name) => {
        const detailsModal = document.getElementById('udharDetailsModal');
        const titleEl = document.getElementById('udharDetailsModalTitle');
        const containerEl = document.getElementById('udharDetailsContainer');
        if (!detailsModal || !titleEl || !containerEl) return;

        titleEl.textContent = `Receivables: ${name.toUpperCase()}`;
        containerEl.innerHTML = '';

        const personEntries = cardbills_udhar.filter(u => (u.name || 'Unknown').trim().toLowerCase() === name.trim().toLowerCase());
        personEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (personEntries.length === 0) {
            containerEl.innerHTML = '<div style="text-align:center;color:#6b7280;padding:20px;">No entries found.</div>';
            return;
        }

        personEntries.forEach(entry => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02); transition: all 0.2s; cursor: default;';
            row.onmouseover = () => { row.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)'; row.style.transform = 'translateY(-1px)'; row.style.borderColor = '#d1d5db'; };
            row.onmouseout = () => { row.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)'; row.style.transform = 'none'; row.style.borderColor = '#e5e7eb'; };
            
            const amt = parseFloat(entry.amount) || 0;
            const dateStr = new Date(entry.date).toLocaleDateString('en-GB');
            
            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 42px; height: 42px; background: #fff7ed; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ea580c;">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <div style="font-weight: 800; color: #1f2937; font-size: 1.1rem; letter-spacing: -0.01em;">₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div style="font-size: 0.85rem; color: #9ca3af; margin-top: 2px; font-weight: 500;">${dateStr}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editUdhar('${entry.id}')" title="Edit Entry" style="background: white; border: 1px solid #e5e7eb; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: #6b7280; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.background='#f3f4f6'; this.style.color='#111827';" onmouseout="this.style.background='white'; this.style.color='#6b7280';">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onclick="deleteUdhar('${entry.id}')" title="Delete Entry" style="background: white; border: 1px solid #fee2e2; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: #ef4444; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.background='#fef2f2'; this.style.color='#b91c1c';" onmouseout="this.style.background='white'; this.style.color='#ef4444';">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
            containerEl.appendChild(row);
        });

        detailsModal.style.display = 'flex';
    };

    const closeUdharDetailsModalFunc = () => {
        const detailsModal = document.getElementById('udharDetailsModal');
        if (detailsModal) detailsModal.style.display = 'none';
    };

    const closeUdharDetailsBtn = document.getElementById('closeUdharDetailsModal');
    if (closeUdharDetailsBtn) closeUdharDetailsBtn.addEventListener('click', closeUdharDetailsModalFunc);

    window.editUdhar = (id) => {
        const entry = cardbills_udhar.find(u => u.id === id);
        if (!entry) return;
        
        editUdharId = id;
        if (udharName) udharName.value = entry.name || '';
        if (udharAmount) udharAmount.value = entry.amount || '';
        if (udharDate) udharDate.value = entry.date || '';
        
        const modalTitle = addUdharModal.querySelector('h3');
        if (modalTitle) modalTitle.textContent = 'Edit Receivable Entry';
        
        closeUdharDetailsModalFunc();
        if (addUdharModal) addUdharModal.style.display = 'flex';
    };

    window.deleteUdhar = (id) => {
        if (confirm('Are you sure you want to delete this receivable entry?')) {
            const idx = cardbills_udhar.findIndex(u => u.id === id);
            if (idx > -1) {
                const name = cardbills_udhar[idx].name;
                cardbills_udhar.splice(idx, 1);
                localStorage.setItem('cardbills_udhar', JSON.stringify(cardbills_udhar));
                renderUdhar();
                
                // If details modal is open, refresh it or close if empty
                const detailsModal = document.getElementById('udharDetailsModal');
                if (detailsModal && detailsModal.style.display === 'flex') {
                    const remaining = cardbills_udhar.filter(u => (u.name || '').trim().toLowerCase() === name.trim().toLowerCase());
                    if (remaining.length > 0) {
                        openUdharDetails(name);
                    } else {
                        closeUdharDetailsModalFunc();
                    }
                }
                
                showToast('Entry deleted.', 'info');
            }
        }
    };

    const closeUdharModalFunc = () => {
        if (addUdharModal) addUdharModal.style.display = 'none';
        if (udharForm) udharForm.reset();
        editUdharId = null;
    };

    if (openAddUdharModalBtn && addUdharModal) {
        openAddUdharModalBtn.addEventListener('click', () => {
            editUdharId = null;
            const modalTitle = addUdharModal.querySelector('h3');
            if (modalTitle) modalTitle.textContent = 'Add Receivable Entry';
            if (udharName) udharName.value = '';
            if (udharAmount) udharAmount.value = '';
            if (udharDate) udharDate.value = new Date().toISOString().split('T')[0];
            addUdharModal.style.display = 'flex';
        });
    }

    if (closeAddUdharModal) closeAddUdharModal.addEventListener('click', closeUdharModalFunc);
    if (cancelUdharBtn) cancelUdharBtn.addEventListener('click', closeUdharModalFunc);

    if (udharForm) {
        udharForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (editUdharId) {
                const idx = cardbills_udhar.findIndex(u => u.id === editUdharId);
                if (idx > -1) {
                    cardbills_udhar[idx].name = udharName.value.trim();
                    cardbills_udhar[idx].amount = parseFloat(udharAmount.value) || 0;
                    cardbills_udhar[idx].date = udharDate.value;
                    cardbills_udhar[idx].timestamp = Date.now();
                }
                showToast('Entry updated successfully!', 'success');
            } else {
                const newU = {
                    id: 'udh_' + Date.now(),
                    name: udharName.value.trim(),
                    amount: parseFloat(udharAmount.value) || 0,
                    date: udharDate.value,
                    timestamp: Date.now()
                };
                cardbills_udhar.push(newU);
                if (typeof showToast === 'function') showToast('Receivable entry added successfully!', 'success');
            }
            
            localStorage.setItem('cardbills_udhar', JSON.stringify(cardbills_udhar));
            renderUdhar();
            
            // If details modal is open (meaning we edited from there), refresh it
            const detailsModal = document.getElementById('udharDetailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                 openUdharDetails(udharName.value.trim());
            }
            
            closeUdharModalFunc();
        });
    }

    // Sync Firebase Data for encapsulated variables
    window.addEventListener('data-synced', (e) => {
        const key = e.detail;
        if (key === 'cardbills_customers') {
            customers = JSON.parse(localStorage.getItem('cardbills_customers')) || [];
            if (typeof renderCustomers === 'function') renderCustomers();
        } else if (key === 'cardbills_transactions') {
            transactions = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
            if (typeof window.renderTransactions === 'function') window.renderTransactions();
            if (typeof window.renderRecentTransactions === 'function') window.renderRecentTransactions();
            if (typeof window.renderAllTransactions === 'function') window.renderAllTransactions();
            if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
            if (typeof window.renderCustomerBalancesReport === 'function') window.renderCustomerBalancesReport();
        } else if (key === 'cardbills_ledger_entries') {
            if (typeof window.renderLedgerEntries === 'function') window.renderLedgerEntries();
            if (typeof window.renderCustomerBalancesReport === 'function') window.renderCustomerBalancesReport();
        } else if (key === 'cardbills_expenses') {
            cardbills_expenses = JSON.parse(localStorage.getItem('cardbills_expenses')) || [];
            if (typeof window.renderExpenses === 'function') window.renderExpenses();
        } else if (key === 'cardbills_extra_profit') {
            cardbills_extra_profit = JSON.parse(localStorage.getItem('cardbills_extra_profit')) || [];
            if (typeof window.renderExtraProfit === 'function') window.renderExtraProfit();
        } else if (key === 'cardbills_udhar') {
            cardbills_udhar = JSON.parse(localStorage.getItem('cardbills_udhar')) || [];
            if (typeof window.renderUdhar === 'function') window.renderUdhar();
        }
    });

});


// ==========================================
// Dashboard Logics
// ==========================================
let dashboardWeeklyChart = null;
let dashboardBrandChart = null;
let currentWeeklyFilter = 'this_week';
let currentScheduleFilter = 'today';
let currentFinancialFilter = 'today';
let currentExpenseFilter = 'monthly';

window.setExpenseFilter = (filter) => {
    currentExpenseFilter = filter;

    // Update active button styling
    ['Today', 'Monthly', 'Yearly', 'Custom'].forEach(f => {
        const btn = document.getElementById('expFilter' + f);
        if (btn) {
            if (f.toLowerCase() === filter) {
                btn.style.background = 'white';
                btn.style.color = '#0f172a';
                btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = '#64748b';
                btn.style.boxShadow = 'none';
            }
        }
    });

    const customWrapper = document.getElementById('expCustomDateWrapper');
    if (customWrapper) {
        customWrapper.style.display = filter === 'custom' ? 'flex' : 'none';
    }

    renderExpenses();
};


// ==================== SETTINGS & PORTALS ====================
let currentPortals = JSON.parse(localStorage.getItem('cardbills_portals')) || [
    { id: 'p1', name: 'QR', portalPercent: 0, customerPercent: 2.5, charges: 0, opening: 0 },
    { id: 'p2', name: 'DIGI SAVA', portalPercent: 1.6, customerPercent: 2.5, charges: 25, opening: 0 },
    { id: 'p3', name: 'BANDHAN BANK', portalPercent: 0.96, customerPercent: 2.5, charges: 0, opening: 0 },
    { id: 'p4', name: 'RAPIPAY', portalPercent: 1.42, customerPercent: 2.5, charges: 10, opening: 0 },
    { id: 'p5', name: 'INTERNATIONAL', portalPercent: 2.5, customerPercent: 3.0, charges: 0, opening: 0 },
    { id: 'p6', name: 'LAKSH FASHION', portalPercent: 1.5, customerPercent: 2.5, charges: 0, opening: 0 }
];

let pinSecurityEnabled = localStorage.getItem('cardbills_pin_enabled') === 'true';
let savedAppPin = localStorage.getItem('cardbills_app_pin') || '';

window.openDashboardSettings = () => {
    const settingsSec = document.getElementById('settingsSection');
    if (settingsSec) {
        document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
        settingsSec.style.display = 'flex';

        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Settings';
    }

    openSettingsTab('portal'); // default to portal
};

window.openSettingsTab = (tabName) => {
    if (tabName === 'pdf') {
        setTimeout(window.loadPdfSettings, 50);
    }
    if (tabName === 'pin') {
        setTimeout(window.renderPinSettings, 50);
    }
    document.getElementById('settings-content-theme').style.display = 'none';
    document.getElementById('settings-content-pin').style.display = 'none';
    document.getElementById('settings-content-portal').style.display = 'none';
    document.getElementById('settings-content-backup').style.display = 'none';
    if (document.getElementById('settings-content-pdf')) document.getElementById('settings-content-pdf').style.display = 'none';

    document.getElementById('tab-theme').style.borderLeft = '3px solid transparent';
    document.getElementById('tab-theme').style.background = 'transparent';
    document.getElementById('tab-theme').style.color = '#4b5563';

    document.getElementById('tab-pin').style.borderLeft = '3px solid transparent';
    document.getElementById('tab-pin').style.background = 'transparent';
    document.getElementById('tab-pin').style.color = '#4b5563';

    document.getElementById('tab-portal').style.borderLeft = '3px solid transparent';
    document.getElementById('tab-portal').style.background = 'transparent';
    document.getElementById('tab-portal').style.color = '#4b5563';

    document.getElementById('tab-backup').style.borderLeft = '3px solid transparent';
    document.getElementById('tab-backup').style.background = 'transparent';
    document.getElementById('tab-backup').style.color = '#4b5563';
    if (document.getElementById('tab-pdf')) {
        document.getElementById('tab-pdf').style.borderLeft = '3px solid transparent';
        document.getElementById('tab-pdf').style.background = 'transparent';
        document.getElementById('tab-pdf').style.color = '#4b5563';
    }

    if (tabName === 'theme') {
        document.getElementById('settings-content-theme').style.display = 'block';
        document.getElementById('tab-theme').style.borderLeft = '3px solid #6366f1';
        document.getElementById('tab-theme').style.background = '#eef2ff';
        document.getElementById('tab-theme').style.color = '#1f2937';
    } else if (tabName === 'pin') {
        document.getElementById('settings-content-pin').style.display = 'block';
        document.getElementById('tab-pin').style.borderLeft = '3px solid #6366f1';
        document.getElementById('tab-pin').style.background = '#eef2ff';
        document.getElementById('tab-pin').style.color = '#1f2937';

        // Update PIN status info display
        const savedPin = localStorage.getItem('cardbills_app_pin');
        const pinStatusInfo = document.getElementById('pinStatusInfo');
        const enablePinToggle = document.getElementById('enablePinToggle');

        if (pinStatusInfo && enablePinToggle) {
            pinStatusInfo.style.display = (enablePinToggle.checked && savedPin) ? 'block' : 'none';
        }
    } else if (tabName === 'portal') {
        document.getElementById('settings-content-portal').style.display = 'block';
        document.getElementById('tab-portal').style.borderLeft = '3px solid #6366f1';
        document.getElementById('tab-portal').style.background = '#eef2ff';
        document.getElementById('tab-portal').style.color = '#1f2937';
        renderPortals();
    } else if (tabName === 'pdf') {
        document.getElementById('settings-content-pdf').style.display = 'block';
        document.getElementById('tab-pdf').style.borderLeft = '3px solid #6366f1';
        document.getElementById('tab-pdf').style.background = '#eef2ff';
        document.getElementById('tab-pdf').style.color = '#1f2937';
        window.loadPdfSettings();
    } else if (tabName === 'backup') {
        document.getElementById('settings-content-backup').style.display = 'block';
        document.getElementById('tab-backup').style.borderLeft = '3px solid #6366f1';
        document.getElementById('tab-backup').style.background = '#eef2ff';
        document.getElementById('tab-backup').style.color = '#1f2937';
    }
};

window.renderPortals = () => {
    try {
        const container = document.getElementById('portalListContainer');
        if (!container) return;

        const badge = document.getElementById('portalCountBadge');
        if (badge) badge.textContent = currentPortals.length + ' Portals';

        container.innerHTML = '';

        if (currentPortals.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">No portals found. Click Add Portal to create one.</div>';
            return;
        }

        const ledger = JSON.parse(localStorage.getItem('cardbills_ledger_entries')) || [];

        currentPortals.forEach((p, index) => {
            // Calculate simple stats based on ledger entries
            let netChange = 0;
            let txCount = 0;
            ledger.forEach(entry => {
                if (entry.portal === p.name) {
                    txCount++;
                    netChange += parseFloat(entry.amount) || 0;
                }
            });

            // Check if it's a negative amount in portal logic? Usually positive means credit.
            // We'll just display it as is.
            const color = netChange >= 0 ? '#10b981' : '#ef4444';
            const bg = netChange >= 0 ? '#ecfdf5' : '#fef2f2';

            const card = document.createElement('div');
            card.style.border = '1px solid #e5e7eb';
            card.style.borderRadius = '8px';
            card.style.padding = '16px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';

            card.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: flex-start; flex: 1;">
        <div style="width: 32px; height: 32px; background: #6366f1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">${index + 1}</div>
        <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
          <div>
            <div style="font-weight: 700; color: #1e1b4b; font-size: 1rem; margin-bottom: 8px;">${p.name}</div>
            <div style="font-size: 0.8rem; color: #6b7280; display: flex; flex-direction: column; gap: 4px;">
              <div>Portal: ${p.portalPercent}%</div>
              <div>Opening: ₹${p.opening || 0}</div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: #6b7280; display: flex; flex-direction: column; gap: 4px; padding-top: 24px;">
            <div>Customer: ${p.customerPercent}%</div>
            <div>Net Change: <span style="color: ${color}; font-weight: 600;">₹${netChange.toFixed(2)}</span></div>
          </div>
          <div style="font-size: 0.8rem; color: #6b7280; display: flex; flex-direction: column; gap: 4px; padding-top: 24px;">
            <div>Charges: ₹${p.charges || 0}</div>
            <div>Transactions: ${txCount}</div>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; flex-shrink: 0; padding-left: 16px;">
        <button onclick="editPortal('${p.id}')" style="background: transparent; border: none; color: #6366f1; cursor: pointer; padding: 4px;" title="Edit">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </button>
        <button onclick="deletePortal('${p.id}')" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Delete">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    `;
            container.appendChild(card);
        });
    } catch (e) { alert('Error in renderPortals: ' + e.message); console.error(e); }
};

window.openAddPortalModal = () => {
    document.getElementById('portalModalTitle').textContent = 'Add New Portal';
    document.getElementById('editPortalId').value = '';
    document.getElementById('portalNameInput').value = '';
    document.getElementById('portalPercentInput').value = '';
    document.getElementById('customerPercentInput').value = '';
    document.getElementById('portalChargesInput').value = '';
    document.getElementById('portalModal').style.display = 'flex';
};

window.closePortalModal = () => {
    document.getElementById('portalModal').style.display = 'none';
};

window.savePortalModal = () => {
    try {
        const id = document.getElementById('editPortalId').value;
        const name = document.getElementById('portalNameInput').value.trim();
        const portalPercent = parseFloat(document.getElementById('portalPercentInput').value) || 0;
        const customerPercent = parseFloat(document.getElementById('customerPercentInput').value) || 0;
        const charges = parseFloat(document.getElementById('portalChargesInput').value) || 0;

        if (!name) {
            alert('Portal Name is required');
            return;
        }

        if (id) {
            // Edit existing
            const idx = currentPortals.findIndex(p => p.id === id);
            if (idx !== -1) {
                currentPortals[idx].name = name;
                currentPortals[idx].portalPercent = portalPercent;
                currentPortals[idx].customerPercent = customerPercent;
                currentPortals[idx].charges = charges;
            }
        } else {
            // Add new
            currentPortals.push({
                id: 'p' + Date.now(),
                name: name,
                portalPercent: portalPercent,
                customerPercent: customerPercent,
                charges: charges,
                opening: 0
            });
        }

        localStorage.setItem('cardbills_portals', JSON.stringify(currentPortals));
        updateSavedPortalsArray();
        closePortalModal();
        renderPortals();

        // If modal was opened from the Wizard, auto-select the portal in the right row
        if (typeof window._pendingPortalWizardIdx !== 'undefined' && window._pendingPortalWizardIdx !== null) {
            const wIdx = window._pendingPortalWizardIdx;
            const wType = window._pendingPortalWizardType;
            const pInfo = currentPortals.find(p => p.name === name);
            if (wType === 'payment' && typeof wizardPayments !== 'undefined') {
                wizardPayments[wIdx].portal = name;
                if (pInfo) {
                    wizardPayments[wIdx].portalPercent = pInfo.portalPercent || '';
                    wizardPayments[wIdx].customerPercent = pInfo.customerPercent || '';
                }
                if (typeof renderWizardPayments === 'function') renderWizardPayments();
            } else if (wType === 'debit' && typeof wizardDebits !== 'undefined') {
                wizardDebits[wIdx].portal = name;
                if (pInfo) {
                    wizardDebits[wIdx].portalPercent = pInfo.portalPercent || '';
                    wizardDebits[wIdx].customerPercent = pInfo.customerPercent || '';
                }
                if (typeof renderWizardDebits === 'function') renderWizardDebits();
            }
            window._pendingPortalWizardIdx = null;
            window._pendingPortalWizardType = null;
        }
    } catch (e) {
        alert('Error in savePortalModal: ' + e.message);
        console.error(e);
    }
};

window.editPortal = (id) => {
    const p = currentPortals.find(x => x.id === id);
    if (!p) return;

    document.getElementById('portalModalTitle').textContent = 'Edit Portal';
    document.getElementById('editPortalId').value = p.id;
    document.getElementById('portalNameInput').value = p.name;
    document.getElementById('portalPercentInput').value = p.portalPercent;
    document.getElementById('customerPercentInput').value = p.customerPercent;
    document.getElementById('portalChargesInput').value = p.charges;
    document.getElementById('portalModal').style.display = 'flex';
};

window.deletePortal = (id) => {
    if (confirm('Are you sure you want to delete this portal?')) {
        currentPortals = currentPortals.filter(p => p.id !== id);
        localStorage.setItem('cardbills_portals', JSON.stringify(currentPortals));
        updateSavedPortalsArray();
        renderPortals();
    }
};

window.updateSavedPortalsArray = () => {
    // Update the global savedPortals array used by Wizard
    if (!window.savedPortals) window.savedPortals = [];
    window.savedPortals.length = 0;
    currentPortals.forEach(p => window.savedPortals.push(p.name));
};

// Setup initial savedPortals bridge
window.updateSavedPortalsArray();

window.togglePinSecurity = () => {
    pinSecurityEnabled = document.getElementById('enablePinToggle').checked;
    localStorage.setItem('cardbills_pin_enabled', pinSecurityEnabled);
    const pinSetupArea = document.getElementById('pinSetupArea');
    const pinStatusInfo = document.getElementById('pinStatusInfo');

    if (pinSetupArea) {
        pinSetupArea.style.display = pinSecurityEnabled ? 'block' : 'none';
    }

    if (pinStatusInfo) {
        const savedPin = localStorage.getItem('cardbills_app_pin');
        pinStatusInfo.style.display = (pinSecurityEnabled && savedPin) ? 'block' : 'none';
    }
};

window.togglePinVisibility = () => {
    const pinInput = document.getElementById('newPinInput');
    if (pinInput) {
        const isPassword = pinInput.type === 'password';
        pinInput.type = isPassword ? 'text' : 'password';
    }
};

window.updatePinStrength = () => {
    const pin = document.getElementById('newPinInput').value;
    const strengthBar = document.getElementById('pinStrengthBar');
    const strengthText = document.getElementById('pinStrengthText');

    if (!pin || pin.length === 0) {
        if (strengthBar) {
            strengthBar.style.width = '0%';
        }
        if (strengthText) {
            strengthText.textContent = 'Empty';
            strengthText.style.color = '#6b7280';
        }
        return;
    }

    let strength = 0;
    let feedback = [];

    // Check if all digits are the same (weak)
    if (new Set(pin).size === 1) {
        strength = 25;
        feedback.push('Repeating digits');
    } else {
        strength = 50;
    }

    // Check for sequential numbers (weak)
    const nums = pin.split('').map(Number);
    const isSequential = (nums[0] === nums[1] - 1 && nums[1] === nums[2] - 1 && nums[2] === nums[3] - 1) ||
        (nums[0] === nums[1] + 1 && nums[1] === nums[2] + 1 && nums[2] === nums[3] + 1);

    if (isSequential) {
        strength = 35;
        feedback = ['Sequential digits'];
    } else if (strength >= 50) {
        strength = 75;
    }

    // Bonus for mix of different digits
    if (new Set(pin).size === 4) {
        strength = 100;
        feedback = ['Strong PIN'];
    }

    if (strengthBar) {
        strengthBar.style.width = strength + '%';
    }

    if (strengthText) {
        let text = '';
        if (strength <= 25) {
            text = 'Very Weak';
            strengthText.style.color = '#dc2626';
        } else if (strength <= 50) {
            text = 'Weak';
            strengthText.style.color = '#f97316';
        } else if (strength <= 75) {
            text = 'Good';
            strengthText.style.color = '#eab308';
        } else {
            text = 'Strong';
            strengthText.style.color = '#22c55e';
        }
        strengthText.textContent = text;
    }
};

window.cancelPinSetup = () => {
    const pinInput = document.getElementById('newPinInput');
    if (pinInput) {
        pinInput.value = '';
        pinInput.type = 'password';
        updatePinStrength();
    }
    const enablePinToggle = document.getElementById('enablePinToggle');
    if (enablePinToggle) {
        enablePinToggle.checked = false;
        togglePinSecurity();
    }
};

window.savePinSettings = () => {
    const pinInput = document.getElementById('newPinInput');
    if (!pinInput) return;
    const pin = pinInput.value.trim();

    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
        alert('Please enter a valid 4-digit PIN (digits only).');
        return;
    }

    localStorage.setItem('cardbills_app_pin', pin);
    localStorage.setItem('cardbills_pin_enabled', 'true');

    // Format current date and time for last changed
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' at ' + now.toLocaleTimeString();
    localStorage.setItem('cardbills_pin_last_changed', dateStr);

    alert('PIN saved successfully! 🔒');
    window.renderPinSettings();
};


window.setFinancialFilter = (filter) => {
    currentFinancialFilter = filter;
    const todayBtn = document.getElementById('toggleFinToday');
    const monthlyBtn = document.getElementById('toggleFinMonthly');
    const yearlyBtn = document.getElementById('toggleFinYearly');
    const allBtns = [todayBtn, monthlyBtn, yearlyBtn];
    allBtns.forEach(btn => {
        if (btn) {
            btn.style.background = 'transparent';
            btn.style.color = '#4b5563';
        }
    });
    const activeBtn = filter === 'today' ? todayBtn : filter === 'monthly' ? monthlyBtn : yearlyBtn;
    if (activeBtn) {
        activeBtn.style.background = '#e5e7eb';
        activeBtn.style.color = '#1f2937';
    }
    renderDashboard();
};

let currentBrandFilter = 'thisWeek';
window.setBrandFilter = (filter) => {
    currentBrandFilter = filter;
    const twBtn = document.getElementById('toggleBrandThisWeek');
    const lwBtn = document.getElementById('toggleBrandLastWeek');
    if (twBtn && lwBtn) {
        twBtn.style.background = filter === 'thisWeek' ? '#e5e7eb' : 'transparent';
        twBtn.style.color = filter === 'thisWeek' ? '#1f2937' : '#4b5563';
        lwBtn.style.background = filter === 'lastWeek' ? '#e5e7eb' : 'transparent';
        lwBtn.style.color = filter === 'lastWeek' ? '#1f2937' : '#4b5563';
    }
    renderDashboard();
};

window.setWeeklyFilter = (filter) => {
    currentWeeklyFilter = filter;
    const thisWeekBtn = document.getElementById('toggleWeeklyThisWeek');
    const lastWeekBtn = document.getElementById('toggleWeeklyLastWeek');
    if (thisWeekBtn && lastWeekBtn) {
        if (filter === 'this_week') {
            thisWeekBtn.style.background = '#e5e7eb';
            thisWeekBtn.style.color = '#1f2937';
            lastWeekBtn.style.background = 'transparent';
            lastWeekBtn.style.color = '#4b5563';
        } else {
            lastWeekBtn.style.background = '#e5e7eb';
            lastWeekBtn.style.color = '#1f2937';
            thisWeekBtn.style.background = 'transparent';
            thisWeekBtn.style.color = '#4b5563';
        }
    }
    updateWeeklyChart();
};

window.setScheduleFilter = (filter) => {
    currentScheduleFilter = filter;
    const todayBtn = document.getElementById('toggleScheduleToday');
    const tomorrowBtn = document.getElementById('toggleScheduleTomorrow');
    if (todayBtn && tomorrowBtn) {
        if (filter === 'today') {
            todayBtn.style.background = '#e5e7eb';
            todayBtn.style.color = '#1f2937';
            tomorrowBtn.style.background = 'transparent';
            tomorrowBtn.style.color = '#4b5563';
        } else {
            tomorrowBtn.style.background = '#e5e7eb';
            tomorrowBtn.style.color = '#1f2937';
            todayBtn.style.background = 'transparent';
            todayBtn.style.color = '#4b5563';
        }
    }
    updateScheduleList();
};

const getWeekRange = (date, offsetWeeks = 0) => {
    const current = new Date(date);
    current.setDate(current.getDate() - (current.getDay() === 0 ? 6 : current.getDay() - 1) + (offsetWeeks * 7));
    current.setHours(0, 0, 0, 0);
    const monday = new Date(current);

    current.setDate(current.getDate() + 6);
    current.setHours(23, 59, 59, 999);
    const sunday = new Date(current);

    return { monday, sunday };
};

const updateWeeklyChart = () => {
    const today = new Date();
    const offset = currentWeeklyFilter === 'this_week' ? 0 : -1;
    const { monday, sunday } = getWeekRange(today, offset);

    const dailyPaid = [0, 0, 0, 0, 0, 0, 0];
    const dailyPending = [0, 0, 0, 0, 0, 0, 0];

    const currentTxs = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
    currentTxs.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate >= monday && txDate <= sunday) {
            let dayIndex = txDate.getDay() - 1;
            if (dayIndex === -1) dayIndex = 6;

            if (tx.isSettlement) return;
            const pendingStr = tx.pending || '0';
            const pendingVal = parseFloat(pendingStr.replace(/[^0-9.-]/g, '')) || 0;
            if (pendingVal <= 0.01) {
                dailyPaid[dayIndex]++;
            } else {
                dailyPending[dayIndex]++;
            }
        }
    });

    if (dashboardWeeklyChart) {
        dashboardWeeklyChart.data.datasets[0].data = dailyPending;
        dashboardWeeklyChart.data.datasets[1].data = dailyPaid;
        dashboardWeeklyChart.update();
    } else {
        const ctx = document.getElementById('dashboardWeeklyChartCanvas');
        if (ctx) {
            dashboardWeeklyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'Pending',
                            data: dailyPending,
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 4
                        },
                        {
                            label: 'Paid',
                            data: dailyPaid,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, precision: 0 }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }
};

const updateScheduleList = () => {
    const scheduleListBody = document.getElementById('dashboardScheduleList');
    if (!scheduleListBody) return;

    scheduleListBody.innerHTML = '';

    const today = new Date();
    const todayDay = today.getDate();

    let targetDay = todayDay;
    if (typeof currentScheduleFilter !== 'undefined' && currentScheduleFilter === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        targetDay = tomorrow.getDate();
    }

    const currentCustomers = JSON.parse(localStorage.getItem('cardbills_customers')) || [];
    const scheduleMap = {};

    currentCustomers.forEach((cust, custIndex) => {
        if (!cust.cards) return;
        cust.cards.forEach((card, cardIndex) => {
            const dueDay = parseInt(card.dueDate) || 1;
            if (dueDay === targetDay) {
                const key = cust.name;
                if (!scheduleMap[key]) {
                    scheduleMap[key] = {
                        name: cust.name,
                        cardCount: new Set()
                    };
                }
                scheduleMap[key].cardCount.add(cardIndex);
            }
        });
    });

    const entries = Object.values(scheduleMap);
    if (entries.length === 0) {
        scheduleListBody.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 24px; font-size: 0.9rem;">No bills scheduled for this day.</div>';
        return;
    }

    entries.forEach(e => {
        const el = document.createElement('div');
        el.style.display = 'flex';
        el.style.justifyContent = 'space-between';
        el.style.alignItems = 'center';
        el.style.padding = '14px 16px';
        el.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        el.style.cursor = 'pointer';
        el.className = 'schedule-item-hover';

        el.innerHTML = `
        <div>
          <h4 style="margin: 0; font-size: 0.95rem; color: #1e1b4b; font-weight: 700; text-transform: uppercase;">${e.name}</h4>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px;">
            <span style="display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #6b7280;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              ${e.cardCount.size} card(s) scheduled
            </span>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="cursor: pointer; flex-shrink: 0; color: #9ca3af;"><polyline points="9 18 15 12 9 6"></polyline></svg>
      `;
        el.onclick = () => window.navToCustomersAndOpen && window.navToCustomersAndOpen(e.name);
        scheduleListBody.appendChild(el);
    });
};

window.navToCustomersAndOpen = (name) => {
    const navCustomers = document.getElementById('navCustomers');
    if (navCustomers) navCustomers.click();
    setTimeout(() => {
        const rows = document.querySelectorAll('.customer-row');
        rows.forEach(r => {
            if (r.textContent.includes(name)) {
                r.click();
            }
        });
    }, 200);
};

const renderDashboard = () => {
    const currentCustomers = JSON.parse(localStorage.getItem('cardbills_customers')) || [];
    const currentTxs = JSON.parse(localStorage.getItem('cardbills_transactions')) || [];
    const ledger = JSON.parse(localStorage.getItem('cardbills_ledger_entries')) || [];
    const blacklist = ['cash', 'system reconciliation', 'bank', 'unassigned'];

    let totCustCharges = 0;
    let totPortalCharges = 0;
    let chgProfit = 0;
    let totExpenses = 0;
    let totTurnover = 0;
    let pendingCharges = 0;

    // Build date range based on financial filter
    const now = new Date();
    let filterStart = null;
    let filterEnd = null;

    if (currentFinancialFilter === 'today') {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterStart = d.getTime();
        filterEnd = d.getTime() + 86399999; // end of day
    } else if (currentFinancialFilter === 'monthly') {
        const y = now.getFullYear();
        const m = now.getMonth();
        filterStart = new Date(y, m, 1).getTime();
        filterEnd = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
    } else if (currentFinancialFilter === 'yearly') {
        const y = now.getFullYear();
        filterStart = new Date(y, 0, 1).getTime();
        filterEnd = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
    }

    currentTxs.forEach(t => {
        // Apply date filter using timestamps
        if (filterStart !== null && filterEnd !== null) {
            let txDateStr = t.date || '';
            if (t.timestamp && !txDateStr) txDateStr = t.timestamp;

            let txTime = new Date(txDateStr).getTime();

            // Robust fallback for DD-MM-YYYY or DD/MM/YYYY formats
            if (isNaN(txTime) && txDateStr) {
                const parts = txDateStr.split(/[-/]/);
                if (parts.length === 3) {
                    const p1 = parseInt(parts[0], 10);
                    const p2 = parseInt(parts[1], 10);
                    const p3 = parseInt(parts[2], 10);
                    if (p3 > 2000) {
                        if (p2 > 12) txTime = new Date(p3, p1 - 1, p2).getTime(); // MM-DD-YYYY
                        else txTime = new Date(p3, p2 - 1, p1).getTime(); // DD-MM-YYYY
                    }
                }
            }

            // If it's STILL invalid, we don't want to show 0.00, we'll assume it matches (fallback)
            if (!isNaN(txTime)) {
                if (txTime < filterStart || txTime > filterEnd) return;
            }
        }
        if (t.isSettlement || t.customerName === 'Settlement Account') return; // Skip settlement entries from dashboard stats

        if (t.raw && t.raw.debits) {
            t.raw.debits.forEach(d => {
                const portalName = d.portal || 'Unassigned';
                // Temporary debug: don't blacklist anything!
                const isBlacklisted = false; // blacklist.includes(portalName.toLowerCase().trim());

                let amt = parseFloat(d.amount) || 0;
                let cFee = parseFloat(d.charges) || (amt * (parseFloat(d.ratePercent) || 0) / 100);
                let pChg = amt * (parseFloat(d.portalPercent) || 0) / 100;

                if (!isBlacklisted) {
                    totCustCharges += cFee;
                    totPortalCharges += pChg;
                    chgProfit += (parseFloat(d.profit) || (cFee - pChg));
                    totTurnover += amt;
                    if (d.chargesStatus === 'Pending' || d.chargesStatus === 'Partially Paid') {
                        let paidAmt = parseFloat(d.paidAmount) || 0;
                        pendingCharges += Math.max(0, cFee - paidAmt);
                    }
                }
            });
        }
    });

    const parseTime = (dateStr) => {
        let t = new Date(dateStr).getTime();
        if (isNaN(t) && dateStr) {
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                const p1 = parseInt(parts[0], 10);
                const p2 = parseInt(parts[1], 10);
                const p3 = parseInt(parts[2], 10);
                if (p3 > 2000) {
                    if (p2 > 12) t = new Date(p3, p1 - 1, p2).getTime();
                    else t = new Date(p3, p2 - 1, p1).getTime();
                }
            }
        }
        return t;
    };

    const passesFilter = (time) => {
        if (isNaN(time)) return true;
        if (filterStart !== null && time < filterStart) return false;
        if (filterEnd !== null && time > filterEnd) return false;
        return true;
    };
    // ledger expenses are no longer counted here to match the expenses page

    const exps = JSON.parse(localStorage.getItem('cardbills_expenses')) || [];
    exps.forEach(exp => {
        let eTime = parseTime(exp.date || '');
        if (passesFilter(eTime)) {
            totExpenses += parseFloat(exp.amount) || 0;
        }
    });

    // chgProfit is already calculated inside the loop

    // Calculate total extra profit
    let totExtraProfit = 0;
    const eps = JSON.parse(localStorage.getItem('cardbills_extra_profit')) || [];
    eps.forEach(ep => {
        let epTime = parseTime(ep.date || '');
        if (passesFilter(epTime)) {
            totExtraProfit += parseFloat(ep.amount) || 0;
        }
    });

    const netProfit = chgProfit;

    const formatValue = (num) => {
        if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
        if (num >= 1000) return (num / 1000).toFixed(1) + ' K';
        return num.toFixed(2);
    };

    const dbNetProfit = document.getElementById('dbNetProfit');
    const dbExtraProfit = document.getElementById('dbExtraProfit');
    const dbTurnover = document.getElementById('dbTurnover');
    const dbTotalCharges = document.getElementById('dbTotalCharges');
    const dbPendingCharges = document.getElementById('dbPendingCharges');

    if (dbNetProfit) dbNetProfit.textContent = '₹' + formatValue(netProfit);
    if (dbExtraProfit) dbExtraProfit.textContent = '₹' + formatValue(totExtraProfit);
    if (dbTurnover) dbTurnover.textContent = '₹' + formatValue(totTurnover);
    if (dbTotalCharges) dbTotalCharges.textContent = '₹' + formatValue(totCustCharges);
    if (dbPendingCharges) dbPendingCharges.textContent = '₹' + formatValue(pendingCharges);

    let dueTodayCount = 0;
    let overdueCount = 0;
    let pendingMonthCount = 0;
    let paidCount = 0;
    const today = new Date();
    const todayDay = today.getDate();

    currentTxs.forEach(tx => {
        if (!tx.raw || tx.isSettlement) return;
        const cust = currentCustomers.find(c => c.name === tx.customerName);
        const card = cust && cust.cards && tx.raw ? cust.cards[tx.raw.cardIndex] : null;
        const pendingStr = tx.pending || '0';
        const pendingVal = parseFloat(pendingStr.replace(/[^0-9.-]/g, '')) || 0;

        if (pendingVal <= 0.01) {
            paidCount++;
        } else {
            if (card) {
                const dueDay = parseInt(card.dueDate) || 1;
                if (dueDay === todayDay) {
                    dueTodayCount++;
                } else if (dueDay < todayDay) {
                    overdueCount++;
                } else {
                    pendingMonthCount++;
                }
            } else {
                pendingMonthCount++;
            }
        }
    });

    const dbDueTodayCount = document.getElementById('dbDueTodayCount');
    const dbOverdueCount = document.getElementById('dbOverdueCount');
    const dbPaidCount = document.getElementById('dbPaidCount');
    const dbPendingMonthCount = document.getElementById('dbPendingMonthCount');

    if (dbDueTodayCount) dbDueTodayCount.textContent = dueTodayCount;
    if (dbOverdueCount) dbOverdueCount.textContent = overdueCount;
    if (dbPaidCount) dbPaidCount.textContent = paidCount;
    if (dbPendingMonthCount) dbPendingMonthCount.textContent = pendingMonthCount;

    const totalPendingCards = dueTodayCount + overdueCount + pendingMonthCount;
    const dbTotalPendingCardsText = document.getElementById('dbTotalPendingCardsText');
    const dbTotalPaidCardsText = document.getElementById('dbTotalPaidCardsText');
    if (dbTotalPendingCardsText) dbTotalPendingCardsText.textContent = totalPendingCards;
    if (dbTotalPaidCardsText) dbTotalPaidCardsText.textContent = paidCount;

    let visaCount = 0;
    let masterCount = 0;
    let rupayCount = 0;
    const bankCounts = {};

    const currentToday = new Date();
    // Get start of this week (Monday) and start of last week
    const dayOfWeek = currentToday.getDay() || 7; // 1-7 (Mon-Sun)
    const thisWeekStart = new Date(currentToday);
    thisWeekStart.setDate(currentToday.getDate() - dayOfWeek + 1);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    currentCustomers.forEach(c => {
        if (c.cards) {
            c.cards.forEach(card => {
                // Check date filter if we can parse the customer createdAt
                let includeCard = true;
                if (c.createdAt) {
                    const cleanedDate = c.createdAt.replace(' at ', ' ');
                    const cTime = new Date(cleanedDate).getTime();
                    if (!isNaN(cTime)) {
                        if (currentBrandFilter === 'thisWeek') {
                            if (cTime < thisWeekStart.getTime()) includeCard = false;
                        } else if (currentBrandFilter === 'lastWeek') {
                            if (cTime < lastWeekStart.getTime() || cTime > lastWeekEnd.getTime()) includeCard = false;
                        }
                    }
                }

                if (includeCard) {
                    const type = (card.type || '').toLowerCase();
                    if (type.includes('visa')) visaCount++;
                    else if (type.includes('master')) masterCount++;
                    else if (type.includes('rupay')) rupayCount++;

                    const bank = card.bank || 'Unknown Bank';
                    bankCounts[bank] = (bankCounts[bank] || 0) + 1;
                }
            });
        }
    });

    const totalCards = visaCount + masterCount + rupayCount;
    const dbTotalCardsText = document.getElementById('dbTotalCardsText');
    const dbVisaCardsText = document.getElementById('dbVisaCardsText');

    if (dbTotalCardsText) dbTotalCardsText.textContent = totalCards;
    if (dbVisaCardsText) dbVisaCardsText.textContent = visaCount;

    const bankListContainer = document.getElementById('dashboardBankList');
    if (bankListContainer) {
        bankListContainer.innerHTML = '';
        Object.entries(bankCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).forEach(([bank, count]) => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.fontSize = '0.9rem';
            item.style.color = '#374151';
            item.style.padding = '8px 0';
            item.style.borderBottom = '1px solid #f3f4f6';
            item.innerHTML = `
          <span>${bank}</span>
          <span style="font-weight: 600; color: #1e1b4b;">${count} cards</span>
        `;
            bankListContainer.appendChild(item);
        });
        if (Object.keys(bankCounts).length === 0) {
            bankListContainer.innerHTML = '<div style="color: #6b7280; font-size: 0.85rem; padding: 12px 0;">No cards added yet.</div>';
        }
    }

    if (typeof Chart !== 'undefined') {
        if (dashboardBrandChart) {
            dashboardBrandChart.data.datasets[0].data = [visaCount, masterCount, rupayCount];
            dashboardBrandChart.update();
        } else {
            const ctx = document.getElementById('dashboardBrandChartCanvas');
            if (ctx) {
                dashboardBrandChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Visa', 'Mastercard', 'Rupay'],
                        datasets: [{
                            data: [visaCount, masterCount, rupayCount],
                            backgroundColor: ['#6366f1', '#ec4899', '#10b981'],
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        }
    }

    updateWeeklyChart();
    updateScheduleList();
};


// ==================== DYNAMIC PIN SECURITY UI ====================
window.renderPinSettings = () => {
    const container = document.getElementById('pinSettingsContainer');
    if (!container) return;

    const isEnabled = localStorage.getItem('cardbills_pin_enabled') === 'true';
    const savedPin = localStorage.getItem('cardbills_app_pin') || '';
    const lastChanged = localStorage.getItem('cardbills_pin_last_changed') || 'Not set';

    if (isEnabled && savedPin) {
        // ACTIVE STATE
        container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
         
         <!-- Security Status Card -->
         <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
               <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="width: 48px; height: 48px; background: #e8f5e9; color: #2e7d32; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                     <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div>
                     <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e1b4b;">Security Status</h4>
                     <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #6b7280;">Current PIN protection status</p>
                  </div>
               </div>
               <div style="display: flex; align-items: center; gap: 8px; background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 9999px; font-size: 0.85rem; font-weight: 700;">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                  Active
               </div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 0.85rem; color: #475569;">
               <strong>PIN last changed:</strong> ${lastChanged}
            </div>
         </div>

         <!-- PIN Management Card -->
         <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
               <div style="width: 40px; height: 40px; background: #eef2ff; color: #2563eb; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                  <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
               </div>
               <div>
                  <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #1e1b4b;">PIN Management</h4>
                  <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #6b7280;">Set up, change, or disable your PIN security</p>
               </div>
            </div>

            <!-- Change PIN Row -->
            <div style="background: #eef2ff; border: 1px solid #c4b5fd; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
               <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="width: 36px; height: 36px; background: #6366f1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                     <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </div>
                  <div>
                     <h5 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #1e3a8a;">Change PIN</h5>
                     <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #6366f1;">Update your current PIN with a new 4-digit combination</p>
                  </div>
               </div>
               <button onclick="window.showPinSetupForm()" style="background: white; border: 1px solid #6366f1; color: #6366f1; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; transition: all 0.2s;" onmouseover="this.style.background='#eef2ff'" onmouseout="this.style.background='white'">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  Change PIN
               </button>
            </div>

            <!-- Disable PIN Row -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
               <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="width: 36px; height: 36px; background: #ef4444; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                     <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </div>
                  <div>
                     <h5 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #991b1b;">Disable PIN Security</h5>
                     <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #ef4444;">Remove PIN protection and disable automatic locking</p>
                  </div>
               </div>
               <button onclick="window.disablePinSecurity()" style="background: white; border: 1px solid #ef4444; color: #ef4444; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; transition: all 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Disable
               </button>
            </div>
         </div>

      </div>
    `;
    } else {
        // INACTIVE STATE OR SETUP STATE
        container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
         
         <!-- Security Status Card (Inactive) -->
         <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
               <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="width: 48px; height: 48px; background: #f1f5f9; color: #475569; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                     <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div>
                     <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e1b4b;">Security Status</h4>
                     <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #6b7280;">Current PIN protection status</p>
                  </div>
               </div>
               <div style="display: flex; align-items: center; gap: 8px; background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 9999px; font-size: 0.85rem; font-weight: 700;">
                  Inactive
               </div>
            </div>
            <div style="background: #fff8f8; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; font-size: 0.85rem; color: #991b1b;">
               PIN lock is currently disabled. Anyone opening this application can view all your cards, ledgers and reports.
            </div>
         </div>

         <!-- Setup Form -->
         <div id="pinSetupFormCard" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
               <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e1b4b;">Set 4-Digit PIN</h4>
               <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 0.85rem;">Set a secure PIN code to protect your transactions and cards.</p>
            </div>

            <div style="max-width: 320px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; align-items: center;">
               <div style="position: relative; width: 100%;">
                  <input type="password" id="newPinInput" maxlength="4" placeholder="••••" style="width: 100%; padding: 14px; border: 1.5px solid #d1d5db; border-radius: 10px; font-size: 1.8rem; text-align: center; letter-spacing: 12px; font-weight: 700; outline: none; box-sizing: border-box; transition: all 0.2s;" onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.15)'" onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'">
               </div>
               
               <div style="display: flex; gap: 12px; width: 100%;">
                  ${savedPin ? `<button onclick="window.renderPinSettings()" style="flex: 1; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>` : ''}
                  <button onclick="window.savePinSettings()" style="flex: 2; background: #1d4ed8; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(29, 78, 216, 0.2); transition: all 0.2s;" onmouseover="this.style.background='#1e40af'" onmouseout="this.style.background='#1d4ed8'">Enable & Save PIN</button>
               </div>
            </div>
         </div>

      </div>
    `;
    }
};

window.showPinSetupForm = () => {
    const container = document.getElementById('pinSettingsContainer');
    if (!container) return;

    const savedPin = localStorage.getItem('cardbills_app_pin') || '';

    // Render setup state even if already enabled (for Change PIN flow)
    localStorage.setItem('cardbills_pin_enabled', 'false'); // Temporarily toggle state to show setup form
    window.renderPinSettings();
    localStorage.setItem('cardbills_pin_enabled', 'true'); // Restore state in local storage so cancel works
};

window.disablePinSecurity = () => {
    if (confirm('Are you sure you want to disable PIN security? This will make the app accessible without any password.')) {
        localStorage.setItem('cardbills_pin_enabled', 'false');
        window.renderPinSettings();
        showToast('PIN security disabled', 'info');
    }
};

/* =========================================
   Authentication Logic (Sign In / Sign Up)
   ========================================= */

let isSignUpMode = false;
window.toggleAuthMode = (e) => {
    if (e) e.preventDefault();
    isSignUpMode = !isSignUpMode;
    const title = document.querySelector('#authScreen h2');
    const subtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleLink = document.getElementById('authToggleLink');
    const errorMsg = document.getElementById('authErrorMsg');
    if (errorMsg) errorMsg.style.display = 'none';

    if (isSignUpMode) {
        title.textContent = 'Create Account';
        subtitle.textContent = 'Register a new Maniya Enterprise account';
        submitBtn.textContent = 'Sign Up';
        toggleLink.textContent = 'Already have an account? Sign In';
    } else {
        title.textContent = 'Welcome Back';
        subtitle.textContent = 'Sign in to your Maniya Enterprise account';
        submitBtn.textContent = 'Sign In';
        toggleLink.textContent = "Don't have an account? Sign Up";
    }
};

function encodeEmail(email) {
    return email.toLowerCase().replace(/\./g, '_').replace(/@/g, '_at_');
}

window.handleAuthSubmit = (e) => {
    e.preventDefault();

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const errorMsg = document.getElementById('authErrorMsg');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (!email || !password) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = 'Please enter email and password.';
        return;
    }

    const encodedEmail = encodeEmail(email);
    submitBtn.disabled = true;
    submitBtn.textContent = isSignUpMode ? 'Registering...' : 'Signing In...';

    // Use raw Firebase DB reference to fetch/set credentials
    const credentialRef = firebase.database().ref('users_credentials/' + encodedEmail);

    credentialRef.once('value').then((snapshot) => {
        const creds = snapshot.val();
        if (isSignUpMode) {
            if (creds) {
                errorMsg.style.display = 'block';
                errorMsg.innerText = 'Account already exists with this email.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            } else {
                // Register new user
                credentialRef.set({ email, password }).then(() => {
                    localStorage.setItem('cardbills_auth_user', 'true');
                    localStorage.setItem('cardbills_logged_in_user_email', email);

                    // Clear any previous local storage keys for other users
                    const SYNC_KEYS = ['cardbills_customers', 'cardbills_transactions', 'cardbills_ledger_entries', 'cardbills_portals', 'cardbills_expenses', 'cardbills_extra_profit'];
                    SYNC_KEYS.forEach(k => localStorage.removeItem(k));

                    hideAuthScreen();
                    location.reload();
                }).catch(err => {
                    errorMsg.style.display = 'block';
                    errorMsg.innerText = 'Registration failed: ' + err.message;
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign Up';
                });
            }
        } else {
            // Sign In mode
            if (creds && creds.password === password) {
                localStorage.setItem('cardbills_auth_user', 'true');
                localStorage.setItem('cardbills_logged_in_user_email', email);

                // Clear local storage for a fresh sync
                const SYNC_KEYS = ['cardbills_customers', 'cardbills_transactions', 'cardbills_ledger_entries', 'cardbills_portals', 'cardbills_expenses', 'cardbills_extra_profit'];
                SYNC_KEYS.forEach(k => {
                    localStorage.removeItem(k);
                    localStorage.removeItem('cardbills_firebase_synced_' + k);
                });

                hideAuthScreen();
                location.reload();
            } else {
                errorMsg.style.display = 'block';
                errorMsg.innerText = 'Invalid email or password.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        }
    }).catch(err => {
        errorMsg.style.display = 'block';
        errorMsg.innerText = 'Database error: ' + err.message;
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
    });
};

function hideAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    authScreen.style.transition = 'opacity 0.4s ease';
    authScreen.style.opacity = '0';

    setTimeout(() => {
        authScreen.style.display = 'none';
        authScreen.style.opacity = '1';

        // Now evaluate PIN Lock logic
        const pinEnabled = localStorage.getItem('cardbills_pin_enabled') === 'true';
        const savedPin = localStorage.getItem('cardbills_app_pin');
        if (pinEnabled && savedPin) {
            const lockScreen = document.getElementById('pinLockScreen');
            lockScreen.style.display = 'flex';
            lockScreen.style.flexDirection = 'column';
        }
    }, 400);
}

window.handleSignOut = () => {
    localStorage.removeItem('cardbills_auth_user');
    localStorage.removeItem('cardbills_logged_in_user_email');
    const SYNC_KEYS = ['cardbills_customers', 'cardbills_transactions', 'cardbills_ledger_entries', 'cardbills_portals', 'cardbills_expenses', 'cardbills_extra_profit'];
    SYNC_KEYS.forEach(k => {
        localStorage.removeItem(k);
        localStorage.removeItem('cardbills_firebase_synced_' + k);
    });
    location.reload();
};

// Sync Firebase Data for global variables
window.addEventListener('data-synced', (e) => {
    if (e.detail === 'cardbills_portals') {
        currentPortals = JSON.parse(localStorage.getItem('cardbills_portals')) || [];
        if (typeof window.renderPortals === 'function') window.renderPortals();
        if (typeof window.renderPortalBalances === 'function') window.renderPortalBalances();
    }
});

// Backup & Restore Logic
window.exportBackupFile = () => {
    const backupData = {
        cardbills_customers: JSON.parse(localStorage.getItem('cardbills_customers') || '[]'),
        cardbills_transactions: JSON.parse(localStorage.getItem('cardbills_transactions') || '[]'),
        cardbills_ledger_entries: JSON.parse(localStorage.getItem('cardbills_ledger_entries') || '[]'),
        cardbills_portals: JSON.parse(localStorage.getItem('cardbills_portals') || '[]'),
        cardbills_expenses: JSON.parse(localStorage.getItem('cardbills_expenses') || '[]'),
        cardbills_extra_profit: JSON.parse(localStorage.getItem('cardbills_extra_profit') || '[]')
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `maniya_enterprise_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup file downloaded successfully', 'success');
};

window.importBackupFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backupData = JSON.parse(e.target.result);
            const keys = ['cardbills_customers', 'cardbills_transactions', 'cardbills_ledger_entries', 'cardbills_portals', 'cardbills_expenses'];
            const hasRequiredKeys = keys.every(key => Array.isArray(backupData[key]));
            if (!hasRequiredKeys) {
                alert('Invalid backup file. Missing required data arrays.');
                return;
            }
            if (confirm('Are you sure you want to restore this backup? This will replace all your current data on this device and on Firebase.')) {
                localStorage.setItem('cardbills_customers', JSON.stringify(backupData.cardbills_customers));
                localStorage.setItem('cardbills_transactions', JSON.stringify(backupData.cardbills_transactions));
                localStorage.setItem('cardbills_ledger_entries', JSON.stringify(backupData.cardbills_ledger_entries));
                localStorage.setItem('cardbills_portals', JSON.stringify(backupData.cardbills_portals));
                if (backupData.cardbills_expenses) {
                    localStorage.setItem('cardbills_expenses', JSON.stringify(backupData.cardbills_expenses));
                }
                if (backupData.cardbills_extra_profit) {
                    localStorage.setItem('cardbills_extra_profit', JSON.stringify(backupData.cardbills_extra_profit));
                }
                showToast('Data restored successfully! Syncing with Firebase...', 'success');
                setTimeout(() => location.reload(), 1500);
            }
        } catch (err) {
            alert('Error parsing backup file: ' + err.message);
        }
    };
    reader.readAsText(file);
};
// ==========================================
// PDF Settings Logic
// ==========================================
window.loadPdfSettings = () => {
    const settings = JSON.parse(localStorage.getItem('cardbills_pdf_settings') || '{}');

    if (document.getElementById('pdfBusinessName')) document.getElementById('pdfBusinessName').value = settings.name || '';
    if (document.getElementById('pdfBusinessPhone')) document.getElementById('pdfBusinessPhone').value = settings.phone || '';
    if (document.getElementById('pdfBusinessEmail')) document.getElementById('pdfBusinessEmail').value = settings.email || '';
    if (document.getElementById('pdfBusinessAddress')) document.getElementById('pdfBusinessAddress').value = settings.address || '';
    if (document.getElementById('pdfFooterText')) document.getElementById('pdfFooterText').value = settings.footer || '';

    // Load Logo
    if (settings.logoBase64) {
        document.getElementById('pdfLogoPreview').src = settings.logoBase64;
        document.getElementById('pdfLogoPreview').style.display = 'block';
        document.getElementById('pdfLogoPlaceholder').style.display = 'none';
        document.getElementById('pdfLogoClearBtn').style.display = 'inline-block';
    } else {
        window.clearPdfImage('pdfLogoPreview', 'pdfLogoPlaceholder', 'pdfLogoInput');
    }

    // Load QR
    if (settings.qrBase64) {
        document.getElementById('pdfQRPreview').src = settings.qrBase64;
        document.getElementById('pdfQRPreview').style.display = 'block';
        document.getElementById('pdfQRPlaceholder').style.display = 'none';
        document.getElementById('pdfQRClearBtn').style.display = 'inline-block';
    } else {
        window.clearPdfImage('pdfQRPreview', 'pdfQRPlaceholder', 'pdfQRInput');
    }
};

window.savePdfSettings = () => {
    const name = document.getElementById('pdfBusinessName').value.trim();
    const phone = document.getElementById('pdfBusinessPhone').value.trim();
    const email = document.getElementById('pdfBusinessEmail').value.trim();
    const address = document.getElementById('pdfBusinessAddress').value.trim();
    const footer = document.getElementById('pdfFooterText').value.trim();

    const logoImg = document.getElementById('pdfLogoPreview');
    const qrImg = document.getElementById('pdfQRPreview');

    const settings = {
        name, phone, email, address, footer,
        logoBase64: (logoImg.style.display === 'block') ? logoImg.src : null,
        qrBase64: (qrImg.style.display === 'block') ? qrImg.src : null
    };

    localStorage.setItem('cardbills_pdf_settings', JSON.stringify(settings));

    // Also push to firebase if sync is active
    if (window.firebaseDB && localStorage.getItem('cardbills_logged_in_user_email')) {
        const encodedEmail = localStorage.getItem('cardbills_logged_in_user_email').toLowerCase().replace(/\./g, '_').replace(/@/g, '_at_');
        window.firebaseDB.write('users/' + encodedEmail + '/cardbills_pdf_settings', settings).catch(e => { });
    }

    showToast('PDF Settings saved successfully!', 'success');
};

window.resetPdfSettings = () => {
    if (!confirm('Reset all PDF settings?')) return;
    localStorage.removeItem('cardbills_pdf_settings');
    window.loadPdfSettings();
    showToast('PDF Settings reset.', 'success');
};

window.handlePdfImageUpload = (input, previewId, placeholderId) => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById(previewId).src = e.target.result;
        document.getElementById(previewId).style.display = 'block';
        document.getElementById(placeholderId).style.display = 'none';

        if (previewId === 'pdfLogoPreview') {
            document.getElementById('pdfLogoClearBtn').style.display = 'inline-block';
        } else {
            document.getElementById('pdfQRClearBtn').style.display = 'inline-block';
        }
    };
    reader.readAsDataURL(file);
};

window.clearPdfImage = (previewId, placeholderId, inputId) => {
    document.getElementById(previewId).src = '';
    document.getElementById(previewId).style.display = 'none';
    document.getElementById(placeholderId).style.display = 'block';
    document.getElementById(inputId).value = '';

    if (previewId === 'pdfLogoPreview') {
        document.getElementById('pdfLogoClearBtn').style.display = 'none';
    } else {
        document.getElementById('pdfQRClearBtn').style.display = 'none';
    }
};
