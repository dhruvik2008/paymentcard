const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

// The block to extract starts with "// ==========================================" 
// and ends at "  }\n\n\n  const searchInput = document.getElementById('transactionSearchInput');"
const startMarker = "  // ==========================================\n  // All Transactions Ledger Logic";
const endMarker = "  const searchInput = document.getElementById('transactionSearchInput');";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex > -1 && endIndex > -1) {
  const blockToMove = content.substring(startIndex, endIndex);
  
  // Remove the block from its current position
  content = content.substring(0, startIndex) + content.substring(endIndex);
  
  // Insert it before `const renderTransactions = () => {`
  const renderIndex = content.indexOf("  const renderTransactions = () => {");
  if (renderIndex > -1) {
    content = content.substring(0, renderIndex) + blockToMove + "\n" + content.substring(renderIndex);
    fs.writeFileSync('script.js', content);
    console.log("Successfully moved block.");
  } else {
    console.log("Could not find renderTransactions");
  }
} else {
  console.log("Could not find start or end markers.");
}
