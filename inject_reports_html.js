const fs = require('fs');

let html = fs.readFileSync('d:\\\\Website\\\\Card\\\\index.html', 'utf-8');

// 1. Fix the Reports Submenu structure in Sidebar
html = html.replace(
  /<div class="nav-submenu" id="submenuReports">/g,
  '<div class="submenu" id="submenuReports" style="display: none; flex-direction: column; padding-left: 20px; gap: 4px; margin-bottom: 8px;">'
);

// 2. Add the two new sections (Customer Balances & Net Profit Report)
const reportsSections = `
      <!-- Customer Balances Section -->
      <section id="customerBalancesSection" class="page-section" style="display: none;">
        <div class="page-content">
          <h1 class="page-title">Customer Balances</h1>
          <p class="page-subtitle" id="cbTotalCustomersSubtitle">0 total customers</p>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="color: #6b7280; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px;">Charges Pending</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #111827;" id="cbChargesPending">₹0.00</div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="color: #6b7280; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px;">Ledger Pending</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #111827;" id="cbLedgerPending">₹0.00</div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="color: #6b7280; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px;">Bills Pending</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #111827;" id="cbBillsPending">₹0.00</div>
            </div>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="color: #166534; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px;">Customers Owe Us</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #15803d;" id="cbCustomersOweUs">₹0.00</div>
            </div>
          </div>

          <div class="search-bar-container">
            <div class="search-input-wrap">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search customer by name or phone..." class="search-input" id="cbSearchInput">
            </div>
          </div>

          <div id="cbGrid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;"></div>
        </div>
      </section>

      <!-- Net Profit Report Section -->
      <section id="netProfitReportSection" class="page-section" style="display: none;">
        <div class="page-content">
          <h1 class="page-title">Net Profit Report</h1>
          <p class="page-subtitle">Track your daily income and expenses</p>

          <div style="background: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f3f4f6; margin-bottom: 24px; display: flex; gap: 16px; align-items: flex-end;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; color: #4b5563; font-weight: 500; margin-bottom: 8px;">Start Date</label>
              <input type="date" id="npStartDate" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; color: #111827; outline: none;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; color: #4b5563; font-weight: 500; margin-bottom: 8px;">End Date</label>
              <input type="date" id="npEndDate" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; color: #111827; outline: none;">
            </div>
            <button class="btn btn-primary" id="npGenerateBtn" style="padding: 10px 24px; height: 42px;">Generate</button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center;">
              <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px;">Customer Charges</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #111827;" id="npCustomerCharges">₹0.00</div>
            </div>
            <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center;">
              <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px;">Portal Charges</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #ef4444;" id="npPortalCharges">₹0.00</div>
            </div>
            <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; position: relative;">
              <div style="position: absolute; left: -8px; top: 50%; transform: translateY(-50%); color: #d1d5db; font-size: 1.5rem;">=</div>
              <div style="color: #0284c7; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">Charge Profit</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #0369a1;" id="npChargeProfit">₹0.00</div>
            </div>
            <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; position: relative;">
              <div style="position: absolute; left: -8px; top: 50%; transform: translateY(-50%); color: #d1d5db; font-size: 1.5rem;">-</div>
              <div style="color: #dc2626; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">Total Expenses</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #b91c1c;" id="npTotalExpenses">₹0.00</div>
            </div>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 12px; border: 1px solid #bbf7d0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; position: relative;">
              <div style="position: absolute; left: -8px; top: 50%; transform: translateY(-50%); color: #d1d5db; font-size: 1.5rem;">=</div>
              <div style="color: #166534; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">Net Profit</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #15803d;" id="npNetProfit">₹0.00</div>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="font-weight: 600; color: #4b5563;">Date</th>
                  <th style="font-weight: 600; color: #4b5563; text-align: right;">Charge Profit</th>
                  <th style="font-weight: 600; color: #4b5563; text-align: right;">Expenses</th>
                  <th style="font-weight: 600; color: #4b5563; text-align: right;">Net Profit</th>
                  <th style="font-weight: 600; color: #4b5563; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody id="npListBody">
                <!-- Daily profit rows go here -->
              </tbody>
            </table>
          </div>
        </div>
      </section>

`;

if (!html.includes('id="customerBalancesSection"')) {
  html = html.replace('  <!-- Toast Notification Container -->', reportsSections + '  <!-- Toast Notification Container -->');
}

fs.writeFileSync('d:\\\\Website\\\\Card\\\\index.html', html, 'utf-8');
console.log('injected reports html');
