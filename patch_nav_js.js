const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

const navCode = `
  const navAllTransactions = document.getElementById('nav-all-transactions');
  const allTransactionsSection = document.getElementById('allTransactionsSection');
  
  if (navAllTransactions && allTransactionsSection) {
    navAllTransactions.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      navAllTransactions.classList.add('active');
      showSection(allTransactionsSection);
      renderAllTransactions();
    });
  }
`;

content = content.replace(
  /const navSettings = document\.getElementById\('nav-settings'\);/,
  navCode + "\n  const navSettings = document.getElementById('nav-settings');"
);

fs.writeFileSync('script.js', content);
console.log("Added navigation logic");
