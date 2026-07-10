const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

js = js.replace(/Customer Debited: \?\$\{formatMoney/g, 'Customer Debited: ₹${formatMoney');
js = js.replace(/Profit: <span style="color: #10b981;">\?\$\{formatMoney/g, 'Profit: <span style="color: #10b981;">₹${formatMoney');

fs.writeFileSync('script.js', js);
console.log("Fixed remaining question marks");
