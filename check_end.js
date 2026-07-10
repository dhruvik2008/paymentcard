const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');
console.log(js.substring(js.length - 500));
