const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const matches = html.match(/id="portalNameInput"/g);
console.log('Count:', matches ? matches.length : 0);
