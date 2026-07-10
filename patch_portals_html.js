const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Add ID to sidebar nav link
html = html.replace(
  /<a href="#" class="nav-item">\s*<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3\s*3v18h18"><\/path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"><\/path><\/svg>\s*Portal Balances\s*<\/a>/,
  `<a href="#" class="nav-item" id="nav-portal-balances">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
            Portal Balances
          </a>`
);

// 2. Inject portalBalancesSection
const portalHtml = `
      <!-- Portal Balances Section -->
      <section id="portalBalancesSection" class="page-section" style="display: none; flex-direction: column;">
        <div class="page-header" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 class="page-title">Portal Balances</h2>
            <p class="page-subtitle">Monitor and manage balances across all payment portals</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button id="refreshPortalsBtn" class="btn btn-outline" style="display: flex; align-items: center; gap: 8px; background: white; border-color: #d1d5db; color: #374151;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 2.13-5.88L21 8"></path></svg>
              Refresh
            </button>
            <button id="dailySettlementBtn" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px; background-color: #0ea5e9; border-color: #0ea5e9;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              Daily Settlement
            </button>
          </div>
        </div>

        <div class="page-content" style="padding: 0; background: transparent;">
          <!-- Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #8b5cf6, #3b82f6);"></div>
              <p style="color: #6b7280; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color: #8b5cf6;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Total Balance
              </p>
              <h3 id="portalTotalBalance" style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 4px;">₹0.00</h3>
              <p style="color: #9ca3af; font-size: 0.8rem;">Across all portals</p>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #0ea5e9, #38bdf8);"></div>
              <p style="color: #6b7280; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color: #0ea5e9;"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                Total Transactions
              </p>
              <h3 id="portalTotalTransactions" style="font-size: 2rem; font-weight: 700; color: #0ea5e9; margin-bottom: 4px;">0</h3>
              <p style="color: #9ca3af; font-size: 0.8rem;">All time activity</p>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #10b981, #34d399);"></div>
              <p style="color: #6b7280; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color: #10b981;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Active Portals
              </p>
              <h3 id="portalActiveCount" style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 4px;">0</h3>
              <p style="color: #9ca3af; font-size: 0.8rem;">Connected accounts</p>
            </div>
          </div>
          
          <!-- Portals Grid -->
          <div id="portalCardsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; margin-bottom: 40px;">
            <!-- Portal cards injected via JS -->
          </div>
        </div>
      </section>
`;

html = html.replace(
  "<!-- Unified Transaction Entry Wizard Section -->",
  portalHtml + "\n\n      <!-- Unified Transaction Entry Wizard Section -->"
);

fs.writeFileSync('index.html', html);
console.log("Injected Portal Balances HTML");
