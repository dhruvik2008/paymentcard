const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
console.log('editPortalId:', html.includes('id="editPortalId"'));
console.log('portalNameInput:', html.includes('id="portalNameInput"'));
console.log('portalPercentInput:', html.includes('id="portalPercentInput"'));
console.log('customerPercentInput:', html.includes('id="customerPercentInput"'));
console.log('portalChargesInput:', html.includes('id="portalChargesInput"'));
