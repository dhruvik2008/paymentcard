const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace Header
const headerStartIdx = html.indexOf('<!-- Header -->');
if (headerStartIdx > -1) {
    const endHeaderIdx = html.indexOf('</div>', html.indexOf('</h1>', headerStartIdx)) + 6;
    const oldHeaderChunk = html.substring(headerStartIdx, endHeaderIdx);
    
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
      
    html = html.replace(oldHeaderChunk, newHeader);
    console.log('Header Replaced');
}

// Replace Footer
const oldFooterEnd = `</table>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n  <!-- End Customer Balance PDF Hidden Template -->`;
// Wait, looking at lines 3470 to 3500, the structure is:
//           <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
//             ...
//           </table>
//         </div>
//       </div>

// Let's just find `<!-- End Customer Balance PDF Hidden Template -->` and inject footer right before it.
const endTagStr = '<!-- End Customer Balance PDF Hidden Template -->';
const endTagIdx = html.indexOf(endTagStr);
if (endTagIdx > -1) {
    // We need to inject the footer inside the white background div.
    // Let's find the closing tag of the template's main wrapper.
    // Actually `<!-- End Customer Balance PDF Hidden Template -->` is at the very end of the hidden div.
    // It looks like:
    //     </div>
    //   </div>
    // <!-- End Customer Balance PDF Hidden Template -->
    
    // We can inject our footer right after the `</table></div></div></div>` of the PayTableBody... wait, the structure ends somewhere. Let's just search for `</table>\n          </div>\n        </div>\n      </div>\n    </div>` 
}
fs.writeFileSync('index.html', html);
