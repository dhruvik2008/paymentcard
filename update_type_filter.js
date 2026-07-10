const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldTypeFilter = `<select id="allCardsTypeFilter" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; background: white;">
            <option value="All Card Types">All Card Types</option>
            <option value="VISA">VISA</option>
            <option value="RuPay">RuPay</option>
            <option value="Mastercard">Mastercard</option>
          </select>`;

const newTypeFilter = `<select id="allCardsTypeFilter" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; background: white;">
            <option value="All Card Types">All Card Types</option>
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="Rupay">Rupay</option>
            <option value="American Express">American Express</option>
            <option value="Diners Club">Diners Club</option>
          </select>`;

if (html.includes('value="VISA">VISA</option>')) {
  // Use regex to replace the type filter block
  html = html.replace(/<select id="allCardsTypeFilter"[\s\S]*?<\/select>/m, newTypeFilter);
  fs.writeFileSync('index.html', html);
  console.log("Replaced Card Type filter in HTML");
} else {
  console.log("Could not find Card Type filter in HTML");
}
