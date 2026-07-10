const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf-8');

content = content.replace(
  /<a href="#" class="nav-item">\s*<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"><\/rect><line x1="16" y1="2" x2="16" y2="6"><\/line><line x1="8" y1="2" x2="8" y2="6"><\/line><line x1="3" y1="10" x2="21" y2="10"><\/line><\/svg>\s*All Transactions\s*<\/a>/,
  `<a href="#" class="nav-item" id="nav-all-transactions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            All Transactions
          </a>`
);

fs.writeFileSync('index.html', content);
console.log("Added ID nav-all-transactions");
