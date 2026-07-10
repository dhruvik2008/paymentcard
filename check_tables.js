const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

const lookAt = (id, label) => {
  const start = lines.findIndex(l => l.includes(id));
  if (start > -1) {
    console.log('\n--- ' + label + ' ---');
    for(let i=start-5; i<start+20; i++) {
      if(lines[i]) console.log(i + ': ' + lines[i].trim());
    }
  }
};

lookAt('id="transactionsSection"', 'Transactions Section');
lookAt('id="allTransactionsSection"', 'All Transactions Section');
lookAt('id="netProfitReportSection"', 'Net Profit Report Section');
