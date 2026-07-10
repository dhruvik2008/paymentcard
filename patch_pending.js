const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

// Fix pending calculation in updateWizardUI
content = content.replace(
  /const pending = bill - paid \+ debit;/g,
  "const pending = Math.max(0, bill - paid) + Math.max(0, paid - debit);"
);

// Fix pendingAmount calculation in submit
content = content.replace(
  /const pendingAmount = bill - paid \+ debit;/g,
  "const pendingAmount = Math.max(0, bill - paid) + Math.max(0, paid - debit);"
);

// Fix txData mapping
content = content.replace(
  /pending: \`\?(\$\{debit\.toLocaleString[^\`]+\})\`,/,
  "pending: `?${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,"
);

fs.writeFileSync('script.js', content);
console.log("Updated pending amount formulas");
