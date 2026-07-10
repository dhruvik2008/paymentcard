const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf-8');

const startIndex = content.indexOf('<!-- Unified Transaction Entry Wizard Section -->');
const endIndex = content.indexOf('</section>', startIndex) + '</section>'.length;

if (startIndex !== -1 && endIndex > startIndex) {
    const wizardBlock = content.substring(startIndex, endIndex);
    
    // Remove it from original place
    content = content.substring(0, startIndex) + content.substring(endIndex);
    
    // Find where transactionsSection ends (which is followed by </main>)
    const mainEndIndex = content.indexOf('</main>');
    if (mainEndIndex !== -1) {
        content = content.substring(0, mainEndIndex) + '\n      ' + wizardBlock + '\n    ' + content.substring(mainEndIndex);
        
        fs.writeFileSync('index.html', content);
        console.log('Wizard moved successfully.');
    } else {
        console.log('</main> not found.');
    }
} else {
    console.log('wizard start not found.');
}
