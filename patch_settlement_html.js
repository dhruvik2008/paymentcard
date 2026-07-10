const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const modalsHtml = `
  <!-- Toast Notification Container -->
  <div id="toastContainer" style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 12px;"></div>

  <!-- Daily Settlement Modal -->
  <div class="modal" id="settlementModal" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1000;">
    <div style="background: white; border-radius: 12px; width: 500px; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
      <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0;">Daily Settlement</h3>
        <button id="closeSettlementModal" style="background: transparent; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer;">&times;</button>
      </div>
      <div id="settlementModalBody" style="padding: 24px; overflow-y: auto; flex: 1;">
        <!-- Settlement details injected here -->
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb; display: flex; justify-content: flex-end; gap: 12px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
        <button id="cancelSettlementBtn" class="btn btn-outline" style="background: white; border-color: #d1d5db; color: #374151;">Cancel</button>
        <button id="confirmSettlementBtn" class="btn btn-primary" style="background-color: #0ea5e9; border-color: #0ea5e9; display: flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Confirm Settlement
        </button>
      </div>
    </div>
  </div>
`;

html = html.replace(
  '<script src="script.js"></script>',
  modalsHtml + '\n  <script src="script.js"></script>'
);

fs.writeFileSync('index.html', html);
console.log("Injected Modal and Toast HTML");
