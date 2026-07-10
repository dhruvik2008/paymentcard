const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const targetFunctionStart = /const renderAllTransactions = \(\) => \{/;

if (targetFunctionStart.test(js)) {
  // Wrap the body of renderAllTransactions in try...catch
  // We'll just replace the start and then find the end.
  js = js.replace(/const renderAllTransactions = \(\) => \{/, 'const renderAllTransactions = () => {\n  try {');
  
  // The function ends before "const renderLedgerEntries = (entries) => {"
  const endRegex = /\}\s*const renderLedgerEntries = \(entries\) => \{/;
  if (endRegex.test(js)) {
    js = js.replace(endRegex, '} catch(e) { alert("Ledger Error: " + e.message); console.error(e); }\n  }\n\n  const renderLedgerEntries = (entries) => {');
    fs.writeFileSync('script.js', js);
    console.log("Wrapped renderAllTransactions in try-catch");
  } else {
    console.log("Could not find the end of renderAllTransactions");
  }
} else {
  console.log("Could not find renderAllTransactions");
}
