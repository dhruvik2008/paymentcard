const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf-8');

const html = `      <!-- All Transactions Ledger Section -->
      <section id="allTransactionsSection" class="page-section" style="display: none;">
        <div class="page-header" style="margin-bottom: 24px;">
          <h2 class="page-title">All Transactions</h2>
          <p class="page-subtitle">View all transactions with bank statement format</p>
        </div>

        <div class="page-content">
          <!-- Filters -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px; align-items: center; flex-wrap: wrap;">
            <select id="ledgerCustomerFilter" class="custom-select" style="min-width: 200px; background-color: #f9fafb; border-color: #d1d5db;">
              <option value="">Select Customer</option>
            </select>
            
            <div style="display: flex; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;">
              <button id="ledgerTypeAll" class="btn" style="border: none; border-radius: 0; padding: 8px 16px; background-color: #0ea5e9; color: white;">All</button>
              <button id="ledgerTypeCredit" class="btn" style="border: none; border-radius: 0; border-left: 1px solid #d1d5db; padding: 8px 16px; background-color: #f9fafb; color: #10b981;">Credit</button>
              <button id="ledgerTypeDebit" class="btn" style="border: none; border-radius: 0; border-left: 1px solid #d1d5db; padding: 8px 16px; background-color: #f9fafb; color: #ef4444;">Debit</button>
            </div>
            
            <select id="ledgerPortalFilter" class="custom-select" style="min-width: 150px; background-color: #f9fafb; border-color: #d1d5db;">
              <option value="">Portal</option>
            </select>
            
            <input type="date" id="ledgerStartDate" class="custom-select" style="background-color: #f9fafb; border-color: #d1d5db; padding-right: 12px;" placeholder="Start Date">
            <input type="date" id="ledgerEndDate" class="custom-select" style="background-color: #f9fafb; border-color: #d1d5db; padding-right: 12px;" placeholder="End Date">
            
            <button id="ledgerClearBtn" class="btn btn-outline" style="display: flex; align-items: center; gap: 6px; background-color: white; border-color: #d1d5db; color: #374151;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Clear
            </button>
          </div>
          
          <!-- Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 24px;">
            <div style="background: white; border: 1px solid #f3f4f6; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Total Credit</p>
                <h3 id="ledgerTotalCredit" style="font-size: 1.5rem; font-weight: 700; color: #111827;">?0.00</h3>
              </div>
              <div style="background-color: #d1fae5; color: #10b981; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
            </div>
            
            <div style="background: white; border: 1px solid #f3f4f6; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Total Debit</p>
                <h3 id="ledgerTotalDebit" style="font-size: 1.5rem; font-weight: 700; color: #111827;">?0.00</h3>
              </div>
              <div style="background-color: #fee2e2; color: #ef4444; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
              </div>
            </div>
            
            <div style="background: white; border: 1px solid #f3f4f6; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Current Balance</p>
                <h3 id="ledgerCurrentBalance" style="font-size: 1.5rem; font-weight: 700; color: #111827;">?0.00</h3>
              </div>
              <div style="background-color: #ede9fe; color: #8b5cf6; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
            </div>
          </div>
          
          <!-- Ledger Table -->
          <div class="table-container" style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <table class="table">
              <thead>
                <tr>
                  <th style="font-weight: 700; color: #111827;">Date & Time</th>
                  <th style="font-weight: 700; color: #111827;">Transaction Details</th>
                  <th style="font-weight: 700; color: #111827;">Party Information</th>
                  <th style="font-weight: 700; color: #111827; text-align: right;">Amount & Impact</th>
                  <th style="font-weight: 700; color: #111827; text-align: right;">Charges</th>
                  <th style="font-weight: 700; color: #111827; text-align: right;">Balance</th>
                </tr>
              </thead>
              <tbody id="ledgerListBody">
                <!-- Ledger entries will be populated here -->
              </tbody>
            </table>
          </div>
        </div>
      </section>`;

content = content.replace("<!-- Unified Transaction Entry Wizard Section -->", html + "\n\n      <!-- Unified Transaction Entry Wizard Section -->");

fs.writeFileSync('index.html', content);
console.log("Injected allTransactionsSection into index.html");
