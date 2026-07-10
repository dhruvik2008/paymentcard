const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// Add ID to sidebar link
html = html.replace('<a href="#" class="nav-item">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>\n          All Cards\n        </a>', 
'<a href="#" id="navAllCards" class="nav-item">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>\n          All Cards\n        </a>');

const allCardsHtml = `
    <!-- ALL CARDS SECTION -->
    <div id="allCardsSection" class="section" style="display: none; padding-top: 20px;">
      <h2 style="font-size: 1.8rem; font-weight: 700; color: #111827; margin: 0 0 24px 0;">Credit Cards</h2>

      <!-- Filters -->
      <div style="background: white; padding: 16px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; margin-bottom: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px; position: relative;">
          <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="allCardsSearch" placeholder="Search by card number or customer name..." style="width: 100%; padding: 10px 10px 10px 36px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem;">
        </div>
        
        <div style="width: 200px;">
          <label style="display: block; font-size: 0.7rem; color: #6b7280; font-weight: 600; margin-bottom: 2px;">Bank</label>
          <select id="allCardsBankFilter" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; background: white;">
            <option value="All Banks">All Banks</option>
            <!-- Dynamic options -->
          </select>
        </div>
        
        <div style="width: 200px;">
          <label style="display: block; font-size: 0.7rem; color: #6b7280; font-weight: 600; margin-bottom: 2px;">Card Type</label>
          <select id="allCardsTypeFilter" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; background: white;">
            <option value="All Card Types">All Card Types</option>
            <option value="VISA">VISA</option>
            <option value="RuPay">RuPay</option>
            <option value="Mastercard">Mastercard</option>
          </select>
        </div>
      </div>

      <!-- Cards Grid -->
      <div id="allCardsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
        <!-- Injected by JS -->
      </div>
    </div>
`;

html = html.replace('</main>', allCardsHtml + '\n    </main>');

fs.writeFileSync('index.html', html);
console.log("Injected All Cards HTML");
