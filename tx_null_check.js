const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const regex = /transactions\.forEach\(tx => \{\s*\/\/ Hide settlement entries from the ledger view\s*if \(tx\.isSettlement\) return;/;
if (regex.test(js)) {
  js = js.replace(regex, `transactions.forEach(tx => {\n      if (!tx) return;\n      // Hide settlement entries from the ledger view\n      if (tx.isSettlement) return;`);
  fs.writeFileSync('script.js', js);
  console.log("Added null check for tx");
} else {
  console.log("Regex didn't match");
}
