const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const marker = '<!-- Drawer Overlay -->';
const firstIdx = html.indexOf(marker);
const secondIdx = html.indexOf(marker, firstIdx + 1);

if (secondIdx !== -1) {
  const scriptTagIdx = html.indexOf('<script src="reports_logic.js">', secondIdx);
  if (scriptTagIdx !== -1) {
    html = html.substring(0, secondIdx) + html.substring(scriptTagIdx);
    fs.writeFileSync('index.html', html);
    console.log("Removed duplicated HTML chunk!");
  } else {
    console.log("Could not find script tag after second marker");
  }
} else {
  console.log("Could not find second marker");
}
