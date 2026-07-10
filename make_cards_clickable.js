const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

js = js.replace(/const cardHTML = `\s*<div style="/, "const cardHTML = `\n        <div style=\"cursor: pointer; transition: transform 0.2s;\" onclick=\"showPortalDetails('${pName}')\" onmouseover=\"this.style.transform='scale(1.02)'\" onmouseout=\"this.style.transform='scale(1)'\">\n        <div style=\"");
js = js.replace(/<\/div>\s*`;/, "</div></div>\n        `;");

fs.writeFileSync('script.js', js);
console.log("Updated Portal Cards to be clickable");
