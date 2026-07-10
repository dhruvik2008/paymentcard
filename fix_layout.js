const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

html = html.replace(
  '<div id="portalDetailSection" class="section" style="display: none; padding-top: 20px;">',
  '<div id="portalDetailSection" class="page-section" style="display: none; padding-top: 20px; flex-direction: column;">'
);

html = html.replace(
  '<div id="allCardsSection" class="section" style="display: none; padding-top: 20px;">',
  '<div id="allCardsSection" class="page-section" style="display: none; padding-top: 20px; flex-direction: column;">'
);

fs.writeFileSync('index.html', html);
console.log("Fixed section classes and layout direction.");
