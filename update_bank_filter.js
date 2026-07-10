const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const bankSelectMatch = html.match(/<select class="custom-select" id="cardBank">([\s\S]*?)<\/select>/);
if (bankSelectMatch) {
  let options = bankSelectMatch[1];
  options = options.replace(/<option value="" disabled selected hidden><\/option>/, '<option value="All Banks">All Banks</option>');
  
  html = html.replace(/<select id="allCardsBankFilter"[\s\S]*?<\/select>/, 
    `<select id="allCardsBankFilter" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; background: white;">\n${options}\n</select>`
  );
  fs.writeFileSync('index.html', html);
  console.log("Replaced Bank filter in HTML with all banks");
} else {
  console.log("Could not find cardBank select in HTML");
}
