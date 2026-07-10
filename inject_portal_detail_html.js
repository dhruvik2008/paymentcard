const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const portalDetailHtml = `
    <!-- PORTAL DETAIL SECTION -->
    <div id="portalDetailSection" class="section" style="display: none;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
        <button id="backToPortalsBtn" style="background: #f3f4f6; border: none; border-radius: 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4b5563;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
          <h2 id="portalDetailTitle" style="font-size: 1.8rem; font-weight: 700; color: #111827; margin: 0 0 4px 0;">Portal Name</h2>
          <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">Portal Balance Report & Transaction History</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <div class="summary-card" style="border-top: 4px solid #10b981; padding: 24px;">
          <div style="font-size: 0.9rem; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Total Credit</div>
          <div id="portalDetailCredit" style="font-size: 1.8rem; font-weight: 700; color: #10b981;">?0.00</div>
        </div>
        <div class="summary-card" style="border-top: 4px solid #ef4444; padding: 24px;">
          <div style="font-size: 0.9rem; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Total Debit</div>
          <div id="portalDetailDebit" style="font-size: 1.8rem; font-weight: 700; color: #ef4444;">?0.00</div>
        </div>
        <div class="summary-card" style="border-top: 4px solid #3b82f6; padding: 24px;">
          <div style="font-size: 0.9rem; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Current Balance</div>
          <div id="portalDetailBalance" style="font-size: 1.8rem; font-weight: 700; color: #3b82f6;">?0.00</div>
        </div>
      </div>

      <div class="card" style="padding: 24px;">
        <h3 style="font-size: 1.1rem; font-weight: 600; color: #111827; margin: 0 0 8px 0;">Transaction History</h3>
        <p style="font-size: 0.85rem; color: #6b7280; margin: 0 0 24px 0;">Complete transaction log for this portal</p>
        
        <div style="overflow-x: auto;">
          <table class="transactions-table">
            <thead>
              <tr>
                <th style="padding: 16px; text-align: left; font-size: 0.85rem; font-weight: 700; color: #374151;">Date & Time</th>
                <th style="padding: 16px; text-align: left; font-size: 0.85rem; font-weight: 700; color: #374151;">Transaction Details</th>
                <th style="padding: 16px; text-align: left; font-size: 0.85rem; font-weight: 700; color: #374151;">Party Information</th>
                <th style="padding: 16px; text-align: left; font-size: 0.85rem; font-weight: 700; color: #374151;">Type</th>
                <th style="padding: 16px; text-align: right; font-size: 0.85rem; font-weight: 700; color: #374151;">Debit</th>
                <th style="padding: 16px; text-align: right; font-size: 0.85rem; font-weight: 700; color: #374151;">Credit</th>
                <th style="padding: 16px; text-align: right; font-size: 0.85rem; font-weight: 700; color: #374151;">Balance</th>
              </tr>
            </thead>
            <tbody id="portalDetailTableBody">
              <!-- JS Injected Rows -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
`;

html = html.replace('<!-- ========================================== -->', portalDetailHtml + '\n    <!-- ========================================== -->');
fs.writeFileSync('index.html', html);
console.log("Injected Portal Detail HTML");
