const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf-8');

content = content.replace(
  /<button class="btn btn-primary" style="background-color: #3b82f6; border-color: #3b82f6; display: flex; align-items: center; gap: 6px;">\s*<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"><\/line><line x1="5" y1="12" x2="19" y2="12"><\/line><\/svg>\s*Add Payment\s*<\/button>/,
  `<button class="btn btn-primary" onclick="actionEdit(window.viewingTransactionIndex, 2)" style="background-color: #3b82f6; border-color: #3b82f6; display: flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Payment
        </button>`
);

content = content.replace(
  /<button class="btn btn-outline" style="background-color: #e5e7eb; border-color: #d1d5db; color: #9ca3af; cursor: not-allowed; display: flex; align-items: center; gap: 6px;" disabled>\s*<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"><\/rect><line x1="16" y1="2" x2="16" y2="6"><\/line><line x1="8" y1="2" x2="8" y2="6"><\/line><line x1="3" y1="10" x2="21" y2="10"><\/line><\/svg>\s*Add Debit\s*<\/button>/,
  `<button class="btn btn-outline" onclick="actionEdit(window.viewingTransactionIndex, 3)" style="background-color: white; border-color: #d1d5db; color: #4b5563; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Add Debit
        </button>`
);

fs.writeFileSync('index.html', content);
console.log("Updated buttons in index.html");
