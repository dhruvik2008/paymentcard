const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const allCardsJs = `
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
    
    // 1. Extract unique cards
    const cardMap = new Map();
    transactions.forEach(tx => {
      if (tx.isSettlement) return;
      if (!tx.customerName || !tx.bank || !tx.cardSuffix) return;
      
      const key = \`\${tx.customerName}_\${tx.bank}_\${tx.cardSuffix}\`.toLowerCase();
      if (!cardMap.has(key)) {
        const details = getDeterministicDetails(key, tx.bank);
        cardMap.set(key, {
          customerName: tx.customerName,
          bank: tx.bank,
          cardSuffix: tx.cardSuffix,
          dueDate: details.dueDate,
          network: details.network
        });
      }
    });

    uniqueCardsCache = Array.from(cardMap.values());
    
    // Populate Bank Dropdown if needed
    const existingBanks = new Set();
    Array.from(allCardsBankFilter.options).forEach(opt => existingBanks.add(opt.value));
    
    uniqueCardsCache.forEach(c => {
      if (!existingBanks.has(c.bank)) {
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
        const str = \`\${c.customerName} \${c.cardSuffix}\`.toLowerCase();
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
      if (c.network === 'VISA') {
        networkLogo = \`<span style="font-weight: 800; font-style: italic; color: #1a1f71; font-size: 1.1rem;">VISA</span>\`;
      } else if (c.network === 'RuPay') {
        networkLogo = \`<span style="font-weight: 700; color: #f26522; font-size: 1.1rem; display: flex; align-items: center;">Ru<span style="color: #00a4e4;">Pay</span></span>\`;
      } else {
        networkLogo = \`<div style="display: flex;"><div style="width: 16px; height: 16px; background: #eb001b; border-radius: 50%;"></div><div style="width: 16px; height: 16px; background: #f79e1b; border-radius: 50%; margin-left: -6px; mix-blend-mode: multiply;"></div></div>\`;
      }

      // Bank icon background color (deterministic)
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
      const bankColor = colors[c.bank.length % colors.length];

      return \`
        <div class="credit-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between; height: 180px; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 15px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)';">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 16px; border-radius: 4px; background: \${bankColor}; display: flex; align-items: center; justify-content: center;">
                <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
              </div>
              <span style="font-weight: 600; font-size: 0.9rem; color: #374151;">\${c.bank}</span>
            </div>
          </div>
          
          <div style="z-index: 1; margin-top: 16px;">
            <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="24" rx="4" fill="#FBBF24"/>
              <path d="M4 8H28M4 16H28M12 4V20M20 4V20" stroke="#D97706" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          
          <div style="z-index: 1; margin-top: 12px; font-family: monospace; font-size: 1.1rem; letter-spacing: 2px; color: #111827;">
            \${c.cardSuffix.slice(0,2)}xx xxxx xxxx \${c.cardSuffix}
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 1; margin-top: auto;">
            <div>
              <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">\${c.customerName}</div>
              <div style="font-size: 0.65rem; color: #9ca3af; margin-top: 2px;">Due Date: \${c.dueDate}</div>
            </div>
            <div>
              \${networkLogo}
            </div>
          </div>
          
          <!-- Decorative background element -->
          <div style="position: absolute; right: -20%; bottom: -20%; width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(241,245,249,0.2)); pointer-events: none;"></div>
        </div>
      \`;
    }).join('');
  };

  if (allCardsSearch) allCardsSearch.addEventListener('input', filterAndDrawCards);
  if (allCardsBankFilter) allCardsBankFilter.addEventListener('change', filterAndDrawCards);
  if (allCardsTypeFilter) allCardsTypeFilter.addEventListener('change', filterAndDrawCards);

`;

js = js.replace(/\/\/ ==========================================\n  \/\/ Sidebar Navigation\n  \/\/ ==========================================/m, `// ==========================================
  // Sidebar Navigation
  // ==========================================
${allCardsJs}
`);

fs.writeFileSync('script.js', js);
console.log("Injected All Cards JS logic");
