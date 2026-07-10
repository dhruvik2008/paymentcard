const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const targetStr = `customers.forEach(customer => {
        if (customer.cards && Array.isArray(customer.cards)) {
          customer.cards.forEach(card => {
            uniqueCardsCache.push({
              customerName: customer.name,
              bank: card.bank || 'Unknown Bank',
              cardSuffix: card.last || 'xxxx',
              first: card.first || 'xxxx',
              dueDate: card.dueDate || '',
              network: card.type || ''
            });
          });
        }
      });`;

const replaceStr = `const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));
      sortedCustomers.forEach((customer, sortedCustIndex) => {
        if (customer.cards && Array.isArray(customer.cards)) {
          customer.cards.forEach((card, cardIndex) => {
            uniqueCardsCache.push({
              customerName: customer.name,
              bank: card.bank || 'Unknown Bank',
              cardSuffix: card.last || 'xxxx',
              first: card.first || 'xxxx',
              dueDate: card.dueDate || '',
              network: card.type || '',
              custIndex: sortedCustIndex,
              cardIndex: cardIndex
            });
          });
        }
      });`;

if (js.includes(targetStr.trim().split('\n')[0])) {
  js = js.replace(targetStr, replaceStr);
  fs.writeFileSync('script.js', js);
  console.log("Successfully added custIndex and cardIndex to uniqueCardsCache");
} else {
  console.log("Could not find the target string!");
}
