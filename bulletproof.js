const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// Replace wizardCustomer.value = custIdx; with wizardCustomer.value = String(custIdx);
js = js.replace('wizardCustomer.value = custIdx;', 'wizardCustomer.value = String(custIdx);');

// Replace wizardCard.value = cardIdx; with wizardCard.value = String(cardIdx);
js = js.replace('wizardCard.value = cardIdx;', 'wizardCard.value = String(cardIdx);');

fs.writeFileSync('script.js', js);
console.log("Bulletproofed value assignment in openWizardForCard");
