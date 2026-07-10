const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');
const searchString = `      const hasDebits = tx.raw && tx.raw.debits && tx.raw.debits.length > 0;`;
const blockStartIndex = js.indexOf(searchString);
if (blockStartIndex !== -1) {
  const blockEndString = `      }\n`;
  const nextOccur = js.indexOf(blockEndString, blockStartIndex + 1000);
  if (nextOccur !== -1) {
    js = js.substring(0, blockStartIndex) + js.substring(nextOccur + blockEndString.length);
    fs.writeFileSync('script.js', js);
    console.log("Removed broken block successfully");
  } else {
    console.log("Could not find end string");
  }
} else {
  console.log("Could not find start string");
}
