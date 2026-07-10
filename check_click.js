const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');
const match = js.match(/<div class="credit-card" onclick="openWizardForCard\(\$\{c\.custIndex\}, \$\{c\.cardIndex\}\)"/);
console.log(match ? "Found click handler" : "Click handler not found");
