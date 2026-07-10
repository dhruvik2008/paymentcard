// Intercept localStorage to sync with Firebase, user-wise data scoped
function encodeEmail(email) {
    return email.toLowerCase().replace(/\./g, '_').replace(/@/g, '_at_');
}

const originalSetItem = localStorage.setItem.bind(localStorage);
const SYNC_KEYS = ['cardbills_customers', 'cardbills_transactions', 'cardbills_ledger_entries', 'cardbills_portals', 'cardbills_pdf_settings'];
const firebaseSyncedKeys = new Set(); // Track which keys have finished initial sync

localStorage.setItem = function (key, value) {
    originalSetItem(key, value);

    if (SYNC_KEYS.includes(key)) {
        // ONLY push to Firebase if we have completed the initial fetch for this key!
        // This prevents local empty state initialization (like []) from overwriting remote data on login.
        if (!firebaseSyncedKeys.has(key)) {
            return; 
        }
        
        const email = localStorage.getItem('cardbills_logged_in_user_email');
        if (email && window.firebaseDB) {
            const encodedEmail = encodeEmail(email);
            const firebasePath = 'users/' + encodedEmail + '/' + key;
            try {
                window.firebaseDB.write(firebasePath, JSON.parse(value)).catch(err => {
                    console.error("Firebase async write error:", err);
                    alert("Firebase Save Error: " + err.message);
                });
            } catch (e) {
                console.error("Firebase sync write error:", e);
                alert("Firebase Sync Error: " + e.message);
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
                let parsedData = data;
                // Firebase converts arrays to objects if there are missing indices. We must convert them back.
                // However, cardbills_pdf_settings is MEANT to be an object, not an array.
                if (typeof data === 'object' && !Array.isArray(data) && key !== 'cardbills_pdf_settings') {
                    parsedData = Object.values(data);
                }
                originalSetItem(key, JSON.stringify(parsedData));
            } else {
                // Firebase is empty (null). 
                const syncFlagKey = 'cardbills_firebase_synced_' + key;
                const hasSyncedBefore = localStorage.getItem(syncFlagKey) === 'true';

                if (hasSyncedBefore) {
                    // We synced before, so this is a remote deletion! Clear local data.
                    originalSetItem(key, (key === 'cardbills_pdf_settings') ? '{}' : '[]');
                } else {
                    // First time connecting, check if we have local data to migrate
                    const localDataStr = localStorage.getItem(key);
                    let localData = key === 'cardbills_pdf_settings' ? {} : [];
                    try { localData = JSON.parse(localDataStr) || localData; } catch (e) { }

                    if (Object.keys(localData).length > 0) {
                        // Push local data to Firebase.
                        console.log(`Pushing existing local ${key} to Firebase...`);
                        try {
                            window.firebaseDB.write(firebasePath, localData).catch(err => console.error(err));
                        } catch (e) { }
                    } else {
                        originalSetItem(key, (key === 'cardbills_pdf_settings') ? '{}' : '[]');
                    }
                }
            }

            // Mark as synced so we know future nulls are deletions
            // And add to our Set so future localStorage.setItems will trigger Firebase uploads
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
