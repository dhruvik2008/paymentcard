const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Inject tab-pdf if not exists
if (!html.includes('id="tab-pdf"')) {
    const targetTabStr = `            <div onclick="openSettingsTab('backup')" id="tab-backup"`;
    const tabHTML = `            <div style="height: 1px; background: #f3f4f6; margin: 8px 0;"></div>
            <div onclick="openSettingsTab('pdf')" id="tab-pdf"
              style="padding: 12px 20px; cursor: pointer; color: #4b5563; font-weight: 500; border-left: 3px solid transparent;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                PDF Settings
              </div>
              <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px; padding-left: 30px;">Customize PDF generation</div>
            </div>

            <div onclick="openSettingsTab('backup')" id="tab-backup"`;
    html = html.replace(targetTabStr, tabHTML);
}

// Inject settings-content-pdf if not exists
if (!html.includes('id="settings-content-pdf"')) {
    const targetContentStr = `            <!-- Backup Content -->`;
    const contentHTML = `            <!-- PDF Settings Content -->
            <div id="settings-content-pdf" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                  <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #111827;">PDF Settings</h3>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button onclick="window.resetPdfSettings()" style="padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; color: #4b5563; cursor: pointer;">Reset</button>
                  <button onclick="window.savePdfSettings()" style="padding: 8px 16px; border: none; background: #6366f1; color: white; border-radius: 6px; cursor: pointer;">Save Settings</button>
                </div>
              </div>

              <!-- Business Information -->
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 16px 0; color: #111827; display: flex; align-items: center; gap: 8px;">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  Business Information
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div class="input-group">
                    <label>Business Name</label>
                    <input type="text" id="pdfBusinessName" placeholder="e.g. MANIYA ENTERPRISE">
                  </div>
                  <div class="input-group">
                    <label>Business Phone</label>
                    <input type="text" id="pdfBusinessPhone" placeholder="e.g. 9033177720">
                  </div>
                  <div class="input-group">
                    <label>Business Email</label>
                    <input type="email" id="pdfBusinessEmail" placeholder="e.g. contact@business.com">
                  </div>
                  <div class="input-group">
                    <label>Business Address</label>
                    <input type="text" id="pdfBusinessAddress" placeholder="e.g. 158- Gruham Empire...">
                  </div>
                </div>
              </div>

              <!-- Branding -->
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 16px 0; color: #111827; display: flex; align-items: center; gap: 8px;">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Branding
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  
                  <div>
                    <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 4px;">Business Logo</label>
                    <p style="font-size: 0.75rem; color: #6b7280; margin: 0 0 8px 0;">Appears in PDF header (recommended: 200x100px)</p>
                    <div style="border: 1px dashed #d1d5db; border-radius: 8px; padding: 24px; text-align: center; background: #f9fafb; position: relative;">
                      <img id="pdfLogoPreview" style="max-height: 80px; max-width: 100%; display: none; margin: 0 auto 12px auto; object-fit: contain;">
                      <div id="pdfLogoPlaceholder">
                        <svg width="32" height="32" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style="margin: 0 auto 8px auto; display: block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <label style="background: #e5e7eb; color: #374151; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Upload Logo
                        <input type="file" id="pdfLogoInput" accept="image/*" style="display: none;" onchange="window.handlePdfImageUpload(this, 'pdfLogoPreview', 'pdfLogoPlaceholder')">
                      </label>
                      <button onclick="window.clearPdfImage('pdfLogoPreview', 'pdfLogoPlaceholder', 'pdfLogoInput')" style="display:none; margin-left: 10px; padding: 6px 12px; border-radius: 4px; border: 1px solid #ef4444; color: #ef4444; background: transparent; cursor: pointer;" id="pdfLogoClearBtn">Remove</button>
                      <p style="font-size: 0.7rem; color: #9ca3af; margin: 8px 0 0 0;">Max 2MB • JPG, PNG, GIF</p>
                    </div>
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 4px;">Payment QR Code</label>
                    <p style="font-size: 0.75rem; color: #6b7280; margin: 0 0 8px 0;">Appears in PDF top-right corner</p>
                    <div style="border: 1px dashed #d1d5db; border-radius: 8px; padding: 24px; text-align: center; background: #f9fafb; position: relative;">
                      <img id="pdfQRPreview" style="max-height: 80px; max-width: 100%; display: none; margin: 0 auto 12px auto; object-fit: contain;">
                      <div id="pdfQRPlaceholder">
                        <svg width="32" height="32" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style="margin: 0 auto 8px auto; display: block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                      </div>
                      <label style="background: #e5e7eb; color: #374151; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Upload QR Code
                        <input type="file" id="pdfQRInput" accept="image/*" style="display: none;" onchange="window.handlePdfImageUpload(this, 'pdfQRPreview', 'pdfQRPlaceholder')">
                      </label>
                      <button onclick="window.clearPdfImage('pdfQRPreview', 'pdfQRPlaceholder', 'pdfQRInput')" style="display:none; margin-left: 10px; padding: 6px 12px; border-radius: 4px; border: 1px solid #ef4444; color: #ef4444; background: transparent; cursor: pointer;" id="pdfQRClearBtn">Remove</button>
                      <p style="font-size: 0.7rem; color: #9ca3af; margin: 8px 0 0 0;">Max 2MB • JPG, PNG, GIF</p>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Footer -->
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 16px 0; color: #111827; display: flex; align-items: center; gap: 8px;">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Footer Text
                </h4>
                <div class="input-group">
                  <input type="text" id="pdfFooterText" placeholder="e.g. Thank you for your business.">
                </div>
              </div>
            </div>

            <!-- Backup Content -->`;
    html = html.replace(targetContentStr, contentHTML);
}

fs.writeFileSync('index.html', html);


// ----------------------------------------------------
// script.js update
// ----------------------------------------------------
let js = fs.readFileSync('script.js', 'utf8');

if (!js.includes('document.getElementById(\'settings-content-pdf\')')) {
  // Update openSettingsTab
  const targetFn = `document.getElementById('settings-content-backup').style.display = 'none';`;
  const replaceFn = `document.getElementById('settings-content-backup').style.display = 'none';
  if(document.getElementById('settings-content-pdf')) document.getElementById('settings-content-pdf').style.display = 'none';`;
  js = js.replace(targetFn, replaceFn);

  const targetTab = `document.getElementById('tab-backup').style.color = '#4b5563';`;
  const replaceTab = `document.getElementById('tab-backup').style.color = '#4b5563';
  if(document.getElementById('tab-pdf')) {
    document.getElementById('tab-pdf').style.borderLeft = '3px solid transparent';
    document.getElementById('tab-pdf').style.background = 'transparent';
    document.getElementById('tab-pdf').style.color = '#4b5563';
  }`;
  js = js.replace(targetTab, replaceTab);

  const targetTabActive = `} else if (tabName === 'backup') {`;
  const replaceTabActive = `} else if (tabName === 'pdf') {
    document.getElementById('settings-content-pdf').style.display = 'block';
    document.getElementById('tab-pdf').style.borderLeft = '3px solid #6366f1';
    document.getElementById('tab-pdf').style.background = '#eef2ff';
    document.getElementById('tab-pdf').style.color = '#1f2937';
    window.loadPdfSettings();
  } else if (tabName === 'backup') {`;
  js = js.replace(targetTabActive, replaceTabActive);

  // Add PDF Settings Logic at the end of the file
  const logic = `
// ==========================================
// PDF Settings Logic
// ==========================================
window.loadPdfSettings = () => {
  const settings = JSON.parse(localStorage.getItem('cardbills_pdf_settings') || '{}');
  
  if(document.getElementById('pdfBusinessName')) document.getElementById('pdfBusinessName').value = settings.name || '';
  if(document.getElementById('pdfBusinessPhone')) document.getElementById('pdfBusinessPhone').value = settings.phone || '';
  if(document.getElementById('pdfBusinessEmail')) document.getElementById('pdfBusinessEmail').value = settings.email || '';
  if(document.getElementById('pdfBusinessAddress')) document.getElementById('pdfBusinessAddress').value = settings.address || '';
  if(document.getElementById('pdfFooterText')) document.getElementById('pdfFooterText').value = settings.footer || '';

  // Load Logo
  if (settings.logoBase64) {
    document.getElementById('pdfLogoPreview').src = settings.logoBase64;
    document.getElementById('pdfLogoPreview').style.display = 'block';
    document.getElementById('pdfLogoPlaceholder').style.display = 'none';
    document.getElementById('pdfLogoClearBtn').style.display = 'inline-block';
  } else {
    window.clearPdfImage('pdfLogoPreview', 'pdfLogoPlaceholder', 'pdfLogoInput');
  }

  // Load QR
  if (settings.qrBase64) {
    document.getElementById('pdfQRPreview').src = settings.qrBase64;
    document.getElementById('pdfQRPreview').style.display = 'block';
    document.getElementById('pdfQRPlaceholder').style.display = 'none';
    document.getElementById('pdfQRClearBtn').style.display = 'inline-block';
  } else {
    window.clearPdfImage('pdfQRPreview', 'pdfQRPlaceholder', 'pdfQRInput');
  }
};

window.savePdfSettings = () => {
  const name = document.getElementById('pdfBusinessName').value.trim();
  const phone = document.getElementById('pdfBusinessPhone').value.trim();
  const email = document.getElementById('pdfBusinessEmail').value.trim();
  const address = document.getElementById('pdfBusinessAddress').value.trim();
  const footer = document.getElementById('pdfFooterText').value.trim();
  
  const logoImg = document.getElementById('pdfLogoPreview');
  const qrImg = document.getElementById('pdfQRPreview');
  
  const settings = {
    name, phone, email, address, footer,
    logoBase64: (logoImg.style.display === 'block') ? logoImg.src : null,
    qrBase64: (qrImg.style.display === 'block') ? qrImg.src : null
  };
  
  localStorage.setItem('cardbills_pdf_settings', JSON.stringify(settings));
  
  // Also push to firebase if sync is active
  if (window.firebaseDB && localStorage.getItem('cardbills_logged_in_user_email')) {
    const encodedEmail = localStorage.getItem('cardbills_logged_in_user_email').toLowerCase().replace(/\\./g, '_').replace(/@/g, '_at_');
    window.firebaseDB.write('users/' + encodedEmail + '/cardbills_pdf_settings', settings).catch(e=>{});
  }

  showToast('PDF Settings saved successfully!', 'success');
};

window.resetPdfSettings = () => {
  if(!confirm('Reset all PDF settings?')) return;
  localStorage.removeItem('cardbills_pdf_settings');
  window.loadPdfSettings();
  showToast('PDF Settings reset.', 'success');
};

window.handlePdfImageUpload = (input, previewId, placeholderId) => {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert('File size exceeds 2MB limit.');
    input.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById(previewId).src = e.target.result;
    document.getElementById(previewId).style.display = 'block';
    document.getElementById(placeholderId).style.display = 'none';
    
    if (previewId === 'pdfLogoPreview') {
      document.getElementById('pdfLogoClearBtn').style.display = 'inline-block';
    } else {
      document.getElementById('pdfQRClearBtn').style.display = 'inline-block';
    }
  };
  reader.readAsDataURL(file);
};

window.clearPdfImage = (previewId, placeholderId, inputId) => {
  document.getElementById(previewId).src = '';
  document.getElementById(previewId).style.display = 'none';
  document.getElementById(placeholderId).style.display = 'block';
  document.getElementById(inputId).value = '';
  
  if (previewId === 'pdfLogoPreview') {
    document.getElementById('pdfLogoClearBtn').style.display = 'none';
  } else {
    document.getElementById('pdfQRClearBtn').style.display = 'none';
  }
};
`;
  
  js = js + logic;
}

fs.writeFileSync('script.js', js);
console.log('Successfully patched index.html and script.js for PDF Settings');
