const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf-8');

// Add viewingTransactionIndex to actionView
content = content.replace(
  "window.actionView = (idx) => {",
  "window.actionView = (idx) => {\n    window.viewingTransactionIndex = idx;"
);

// Add step parameter to actionEdit
content = content.replace(
  "window.actionEdit = (idx) => {",
  "window.actionEdit = (idx, step = 1) => {"
);

// Use the step parameter in actionEdit
content = content.replace(
  /currentWizardStep = 1;\s*updateWizardUI\(\);\s*showSection\(wizardSection\);/,
  "currentWizardStep = step;\n    updateWizardUI();\n    showSection(wizardSection);"
);

fs.writeFileSync('script.js', content);
console.log("Updated actionView and actionEdit");
