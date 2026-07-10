const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

// Append event listeners to the very end of the file
content += `\n
  const searchInput = document.getElementById('transactionSearchInput');
  const statusFilter = document.getElementById('transactionStatusFilter');
  if (searchInput) searchInput.addEventListener('input', renderTransactions);
  if (statusFilter) statusFilter.addEventListener('change', renderTransactions);
`;

fs.writeFileSync('script.js', content);
console.log("Appended event listeners");
