const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
const lineNum = lines.findIndex(l => l.includes('id="portalListContainer"'));
for(let i = lineNum - 10; i < lineNum + 5; i++) {
  console.log(lines[i]);
}
