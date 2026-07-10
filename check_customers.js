const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');
const match = js.match(/let customers = JSON\.parse.*?\|\| (\[[\s\S]*?\]);/m);
if (match) {
  console.log(match[1].slice(0, 500) + '...');
} else {
  console.log("Not found");
}
