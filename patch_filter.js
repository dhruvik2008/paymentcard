const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

// Replace renderTransactions logic to include filtering
const oldRender = `  const renderTransactions = () => {
    transactionListBody.innerHTML = '';
    transactions.forEach((tx, index) => {`;

const newRender = `  const renderTransactions = () => {
    transactionListBody.innerHTML = '';
    
    const searchInput = document.getElementById('transactionSearchInput');
    const statusFilter = document.getElementById('transactionStatusFilter');
    
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const status = statusFilter ? statusFilter.value : 'All Status';
    
    transactions.forEach((tx, index) => {
      // Filter logic
      if (status !== 'All Status' && tx.status !== status) return;
      
      if (query) {
        const searchStr = \`\${tx.customerName} \${tx.customerPhone} \${tx.bank} \${tx.cardSuffix} \${tx.bill} \${tx.date}\`.toLowerCase();
        if (!searchStr.includes(query)) return;
      }`;

content = content.replace(oldRender, newRender);

// Add event listeners at the end of the script or after renderTransactions definition
content = content.replace(
  /renderTransactions\(\);\s*$/,
  `renderTransactions();
  
  const searchInput = document.getElementById('transactionSearchInput');
  const statusFilter = document.getElementById('transactionStatusFilter');
  if (searchInput) searchInput.addEventListener('input', renderTransactions);
  if (statusFilter) statusFilter.addEventListener('change', renderTransactions);
`
);

fs.writeFileSync('script.js', content);
console.log("Updated renderTransactions for filtering");
