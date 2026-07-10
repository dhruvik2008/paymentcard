const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldHeader = `<div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #1f2937; margin: 0; text-transform: uppercase;">Maniya
          Enterprise</h1>
      </div>`;

const newHeader = `<!-- PDF Dynamic Header -->
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <img id="pdfRenderLogo" style="max-height: 80px; max-width: 150px; display: none; object-fit: contain;">
          <div>
            <h1 id="pdfRenderBusinessName" style="font-size: 26px; font-weight: 800; color: #1f2937; margin: 0; text-transform: uppercase;">Business Name</h1>
            <p id="pdfRenderBusinessAddress" style="font-size: 14px; color: #4b5563; margin: 4px 0 0 0; max-width: 300px; display: none;"></p>
            <p id="pdfRenderBusinessContact" style="font-size: 14px; color: #4b5563; margin: 4px 0 0 0; display: none;"></p>
          </div>
        </div>
        <img id="pdfRenderQR" style="max-height: 80px; max-width: 80px; display: none; object-fit: contain;">
      </div>`;

if (html.includes(oldHeader)) {
    html = html.replace(oldHeader, newHeader);
    fs.writeFileSync('index.html', html);
    console.log('Header replaced in index.html');
}

// Add Footer to PDF Template
const oldFooter = `</table>
        </div>
      </div>

    </div>
  </div>
  <!-- End Customer Balance PDF Hidden Template -->`;

const footerMatch = html.indexOf(`</table>\n        </div>\n      </div>`);
if (footerMatch > -1 && !html.includes('id="pdfRenderFooter"')) {
    html = html.replace(`</table>\n        </div>\n      </div>`, 
`</table>\n        </div>\n      </div>\n      <!-- PDF Dynamic Footer -->\n      <div style="margin-top: 30px; text-align: center; border-top: 1px dashed #e5e7eb; padding-top: 16px;">\n        <p id="pdfRenderFooter" style="font-size: 13px; color: #6b7280; font-weight: 500; margin: 0; display: none;"></p>\n      </div>`);
    fs.writeFileSync('index.html', html);
    console.log('Footer injected into PDF template');
}
