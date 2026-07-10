// Firebase initialization using CDN compat API (works on file:// protocol)
// CDN scripts are loaded in index.html before this file

const firebaseConfig = {
    apiKey: "AIzaSyDy016MUXn9maKQ8oDIktKf2GVySdBkP7A",
    authDomain: "card-4f712.firebaseapp.com",
    databaseURL: "https://card-4f712-default-rtdb.firebaseio.com",
    projectId: "card-4f712",
    storageBucket: "card-4f712.firebasestorage.app",
    messagingSenderId: "592899650818",
    appId: "1:592899650818:web:170185d35f24998268be1b",
    measurementId: "G-3SWB4EYC09"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Expose a minimal API on window.firebaseDB
window.firebaseDB = {
    write(path, data) {
        return db.ref(path).set(data);
    },
    push(path, data) {
        return db.ref(path).push(data);
    },
    update(path, data) {
        return db.ref(path).update(data);
    },
    remove(path) {
        return db.ref(path).remove();
    },
    // listen(path, callback) -> returns the unsubscribe function
    listen(path, callback) {
        const ref = db.ref(path);
        ref.on('value', (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null);
        });
        // Return off function to unsubscribe
        return () => ref.off('value');
    }
};

// Signal that Firebase is ready
window.dispatchEvent(new Event('firebase-ready'));