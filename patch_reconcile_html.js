const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const newModalHtml = `
  <!-- Daily Settlement Modal -->
  <div class="modal" id="settlementModal" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1000;">
    <div style="background: white; border-radius: 12px; width: 600px; max-width: 90vw; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
      <div style="padding: 24px 24px 20px 24px; border-bottom: 1px solid #e5e7eb;">
        <h3 style="font-size: 1.25rem; font-weight: 600; color: #374151; margin: 0;">Daily Settlement - Overall Balance</h3>
      </div>
      <div id="settlementModalBody" style="padding: 24px; background: #f9fafb;">
        <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 24px; margin-top: 0;">Record the difference between expected and actual balance across all portals for end-of-day reconciliation.</p>
        
        <div style="margin-bottom: 24px; position: relative; border: 1px solid #d1d5db; border-radius: 6px; background: transparent;">
          <label style="position: absolute; top: -8px; left: 12px; background: #f9fafb; padding: 0 4px; font-size: 0.75rem; color: #9ca3af;">Settlement Date</label>
          <input type="date" id="settlementDate" style="width: 100%; padding: 12px; border: none; background: transparent; color: #374151; font-size: 1rem; outline: none; box-sizing: border-box;">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="position: relative;">
            <label style="position: absolute; top: -8px; left: 12px; background: #f9fafb; padding: 0 4px; font-size: 0.75rem; color: #9ca3af;">Expected Balance</label>
            <div style="display: flex; align-items: center; border: 1px solid #d1d5db; border-radius: 6px; padding: 11px 12px; background: transparent;">
              <span style="color: #6b7280; margin-right: 8px;">₹</span>
              <input type="text" id="settlementExpected" readonly style="width: 100%; border: none; background: transparent; color: #374151; font-size: 1rem; outline: none;">
            </div>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 8px 0 0 4px;">System calculated balance</p>
          </div>
          
          <div style="position: relative;">
            <label style="position: absolute; top: -10px; left: 12px; background: #f9fafb; padding: 0 4px; font-size: 0.75rem; color: #0ea5e9; font-weight: 600; z-index: 10;">Actual Balance</label>
            <div style="display: flex; align-items: center; border: 2px solid #0ea5e9; border-radius: 6px; padding: 10px 12px; background: white; position: relative;">
              <span style="color: #6b7280; margin-right: 8px;">₹</span>
              <input type="number" id="settlementActual" placeholder="" style="width: 100%; border: none; background: transparent; color: #374151; font-size: 1rem; outline: none;">
            </div>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 8px 0 0 4px;">Your counted/verified balance</p>
          </div>
        </div>
        
        <textarea id="settlementNotes" rows="3" placeholder="Notes (Optional)" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; background: transparent; color: #374151; font-size: 0.95rem; resize: vertical; box-sizing: border-box; outline: none;"></textarea>
      </div>
      
      <div style="padding: 20px 24px; background: white; display: flex; justify-content: flex-end; gap: 16px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
        <button id="cancelSettlementBtn" style="background: transparent; border: none; color: #111827; font-weight: 600; font-size: 1rem; cursor: pointer;">Cancel</button>
        <button id="confirmSettlementBtn" class="btn" style="background-color: #e5e7eb; color: #9ca3af; border: none; padding: 8px 24px; font-weight: 600; border-radius: 6px; cursor: not-allowed;" disabled>Record Settlement</button>
      </div>
    </div>
  </div>`;

// Replace the old modal block
html = html.replace(/<!-- Daily Settlement Modal -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newModalHtml);

fs.writeFileSync('index.html', html);
console.log("Injected updated Settlement UI");
