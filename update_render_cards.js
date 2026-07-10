const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const newRenderLogic = `
  const renderAllCards = () => {
    if (!allCardsGrid) return;
    
    uniqueCardsCache = [];
    
    // Extract actual cards from the customers database
    if (typeof customers !== 'undefined' && Array.isArray(customers)) {
      customers.forEach(customer => {
        if (customer.cards && Array.isArray(customer.cards)) {
          customer.cards.forEach(card => {
            uniqueCardsCache.push({
              customerName: customer.name,
              bank: card.bank || 'Unknown Bank',
              cardSuffix: card.last || 'xxxx',
              first: card.first || 'xxxx',
              dueDate: card.dueDate || '',
              network: card.type || ''
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
      const net = c.network ? c.network.toLowerCase() : '';
      if (net.includes('visa')) {
        networkLogo = \`<span style="font-weight: 800; font-style: italic; color: #1a1f71; font-size: 1.1rem;">VISA</span>\`;
      } else if (net.includes('rupay')) {
        networkLogo = \`<span style="font-weight: 700; color: #f26522; font-size: 1.1rem; display: flex; align-items: center;">Ru<span style="color: #00a4e4;">Pay</span></span>\`;
      } else if (net.includes('mastercard')) {
        networkLogo = \`<div style="display: flex;"><div style="width: 16px; height: 16px; background: #eb001b; border-radius: 50%;"></div><div style="width: 16px; height: 16px; background: #f79e1b; border-radius: 50%; margin-left: -6px; mix-blend-mode: multiply;"></div></div>\`;
      } else if (net.includes('american express') || net.includes('amex')) {
        networkLogo = \`<div style="background: #002663; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold; font-size: 0.6rem; text-align: center; line-height: 1;">AM<br>EX</div>\`;
      } else if (net.includes('diners')) {
        networkLogo = \`<div style="font-weight: bold; color: #004b8d; font-size: 0.8rem; font-style: italic;">Diners Club</div>\`;
      } else if (c.network) {
        networkLogo = \`<span style="font-weight: 600; color: #4b5563; font-size: 0.9rem;">\${c.network}</span>\`;
      }

      // Bank icon using the original getBankLogo function
      // getBankLogo returns an HTML string
      const bankLogoHtml = getBankLogo ? getBankLogo(c.bank) : '';

      // Fix card number rendering
      const first4 = (c.first && c.first.length > 0) ? (c.first.length === 4 ? c.first : c.first.padEnd(4, 'x')) : 'xxxx';
      const last4 = (c.cardSuffix && c.cardSuffix.length > 0) ? (c.cardSuffix.length === 4 ? c.cardSuffix : c.cardSuffix.padStart(4, 'x')) : 'xxxx';
      
      const dueDateDisplay = c.dueDate ? \`Due Date: \${c.dueDate}\` : '';

      return \`
        <div class="credit-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between; height: 180px; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 15px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)';">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              \${bankLogoHtml}
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
            \${first4} xxxx xxxx \${last4}
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 1; margin-top: auto;">
            <div>
              <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">\${c.customerName}</div>
              <div style="font-size: 0.65rem; color: #9ca3af; margin-top: 2px;">\${dueDateDisplay}</div>
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
`;

const oldRenderAllCardsPattern = /const renderAllCards = \(\) => \{[\s\S]*?\}\)\.join\(''\);\n  \};/m;

if (oldRenderAllCardsPattern.test(js)) {
  js = js.replace(oldRenderAllCardsPattern, newRenderLogic.trim());
  fs.writeFileSync('script.js', js);
  console.log("Successfully replaced renderAllCards logic");
} else {
  console.log("Could not find renderAllCards in script.js");
}
