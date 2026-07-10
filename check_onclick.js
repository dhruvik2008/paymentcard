const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');
const match = js.match(/openWizardForCard\(\$\{c\.custIndex\}, \$\{c\.cardIndex\}\)/);
if (match) {
  console.log("Match found:", match[0]);
} else {
  console.log("No match found!");
}
