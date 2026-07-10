const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `      </table>\n    </div>\n  </div>\n\n  <!-- Net Profit Details Modal -->`;
const replaceStr = `      </table>\n      <!-- PDF Dynamic Footer -->\n      <div style="margin-top: 30px; text-align: center; border-top: 1px dashed #e5e7eb; padding-top: 16px;">\n        <p id="pdfRenderFooter" style="font-size: 13px; color: #6b7280; font-weight: 500; margin: 0; display: none;"></p>\n      </div>\n    </div>\n  </div>\n\n  <!-- Net Profit Details Modal -->`;

if (html.includes(targetStr) && !html.includes('id="pdfRenderFooter"')) {
    html = html.replace(targetStr, replaceStr);
    fs.writeFileSync('index.html', html);
    console.log('Injected footer!');
} else {
    console.log('Footer already exists or target not found.');
}
