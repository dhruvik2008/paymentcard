// Intercept localStorage to sync with Firebase, user-wise data scoped
function encodeEmail(email) {
    return email.toLowerCase().replace(/\./g, '_').replace(/@/g, '_at_');
}

const originalSetItem = localStorage.setItem.bind(localStorage);
const PRIMITIVE_SYNC_KEYS = ['cardbills_app_pin', 'cardbills_pin_enabled', 'cardbills_pin_last_changed'];
const SYNC_KEYS = ['cardbills_customers', 'cardbills_transactions', 'cardbills_ledger_entries', 'cardbills_portals', 'cardbills_pdf_settings', 'cardbills_expenses', 'cardbills_extra_profit', 'cardbills_udhar', ...PRIMITIVE_SYNC_KEYS];
const firebaseSyncedKeys = new Set(); // Track which keys have finished initial sync

localStorage.setItem = function (key, value) {
    originalSetItem(key, value);

    if (SYNC_KEYS.includes(key)) {
        // Dispatch local event IMMEDIATELY so all UI views & reports update instantly without waiting for network/firebase
        window.dispatchEvent(new CustomEvent('data-synced', { detail: key }));

        // ONLY push to Firebase if we have completed the initial fetch for this key!
        if (!firebaseSyncedKeys.has(key)) {
            return;
        }

        const email = localStorage.getItem('cardbills_logged_in_user_email');
        if (email && window.firebaseDB) {
            const encodedEmail = encodeEmail(email);
            const firebasePath = 'users/' + encodedEmail + '/' + key;
            try {
                const valToWrite = PRIMITIVE_SYNC_KEYS.includes(key) ? value : JSON.parse(value);
                window.firebaseDB.write(firebasePath, valToWrite).catch(err => {
                    console.error("Firebase async write error:", err);
                });
            } catch (e) {
                console.error("Firebase sync write error:", e);
            }
        }
    }
};

function startSync() {
    const email = localStorage.getItem('cardbills_logged_in_user_email');
    if (!email) {
        console.log("No logged in user, skipping Firebase sync listeners.");
        return;
    }

    console.log("Firebase is ready, starting sync listeners for: " + email);
    const encodedEmail = encodeEmail(email);

    SYNC_KEYS.forEach(key => {
        const firebasePath = 'users/' + encodedEmail + '/' + key;
        window.firebaseDB.listen(firebasePath, (data) => {
            if (data !== null) {
                if (PRIMITIVE_SYNC_KEYS.includes(key)) {
                    originalSetItem(key, String(data));
                } else {
                    let parsedData = data;
                    if (typeof data === 'object' && !Array.isArray(data) && key !== 'cardbills_pdf_settings') {
                        parsedData = Object.values(data);
                    }
                    originalSetItem(key, JSON.stringify(parsedData));
                }
            } else {
                // Firebase is empty (null) for this key
                const syncFlagKey = 'cardbills_firebase_synced_' + key;
                const hasSyncedBefore = localStorage.getItem(syncFlagKey) === 'true';

                if (hasSyncedBefore) {
                    // Remote deletion or empty
                    if (PRIMITIVE_SYNC_KEYS.includes(key)) {
                        if (key === 'cardbills_app_pin') {
                            const defaultPin = window.hashPin ? window.hashPin('2012') : '2012';
                            originalSetItem(key, defaultPin);
                        } else if (key === 'cardbills_pin_enabled') {
                            originalSetItem(key, 'true');
                        }
                    } else {
                        originalSetItem(key, (key === 'cardbills_pdf_settings') ? '{}' : '[]');
                    }
                } else {
                    // First time connecting on this device
                    if (key === 'cardbills_app_pin') {
                        let curPin = localStorage.getItem('cardbills_app_pin');
                        if (!curPin) {
                            curPin = window.hashPin ? window.hashPin('2012') : '2012';
                            originalSetItem('cardbills_app_pin', curPin);
                            originalSetItem('cardbills_pin_enabled', 'true');
                        }
                        try { window.firebaseDB.write(firebasePath, curPin).catch(e => { }); } catch (e) { }
                    } else if (key === 'cardbills_pin_enabled') {
                        let curEn = localStorage.getItem('cardbills_pin_enabled');
                        if (!curEn) {
                            curEn = 'true';
                            originalSetItem('cardbills_pin_enabled', 'true');
                        }
                        try { window.firebaseDB.write(firebasePath, curEn).catch(e => { }); } catch (e) { }
                    } else {
                        const localDataStr = localStorage.getItem(key);
                        let localData = key === 'cardbills_pdf_settings' ? {} : [];
                        try { localData = JSON.parse(localDataStr) || localData; } catch (e) { }

                        if (Object.keys(localData).length > 0) {
                            console.log(`Pushing existing local ${key} to Firebase...`);
                            try {
                                window.firebaseDB.write(firebasePath, localData).catch(err => console.error(err));
                            } catch (e) { }
                        } else {
                            originalSetItem(key, (key === 'cardbills_pdf_settings') ? '{}' : '[]');
                        }
                    }
                }
            }

            // Mark as synced so we know future nulls are handled
            firebaseSyncedKeys.add(key);
            localStorage.setItem('cardbills_firebase_synced_' + key, 'true');
            // Notify the app that data has been synced
            window.dispatchEvent(new CustomEvent('data-synced', { detail: key }));
        });
    });
}

if (window.firebaseDB) {
    startSync();
} else {
    window.addEventListener('firebase-ready', startSync);
}
