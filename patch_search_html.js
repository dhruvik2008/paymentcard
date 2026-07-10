const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf-8');

content = content.replace(
  /<input type="text" placeholder="Search bills, customers, cards\.\.\." class="search-input" style="width: 400px;">/,
  '<input type="text" id="transactionSearchInput" placeholder="Search bills, customers, cards..." class="search-input" style="width: 400px;">'
);

content = content.replace(
  /<select class="custom-select" style="min-width: 150px; background-color: #f9fafb; border-color: #d1d5db;">/,
  '<select id="transactionStatusFilter" class="custom-select" style="min-width: 150px; background-color: #f9fafb; border-color: #d1d5db;">'
);

fs.writeFileSync('index.html', content);
console.log("Added IDs to search and filter inputs");
