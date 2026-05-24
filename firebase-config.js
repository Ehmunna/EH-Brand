// Firebase Configuration for User Website
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyC2Bsd-HqfhhC8i5cQUF2ZmofUJaFIcvDs",
    authDomain: "lamim-754aa.firebaseapp.com",
    projectId: "lamim-754aa",
    storageBucket: "lamim-754aa.firebasestorage.app",
    messagingSenderId: "1087897423283",
    appId: "1:1087897423283:web:10a57c0acf8879fc1e4fc6",
    measurementId: "G-R5SNM13YMG"
};

// Initialize Firebase
try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Make globally available
    window.firebaseApp = app;
    window.firebaseDb = db;
    window.firebaseReady = true;
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('firebaseReady'));
    
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    window.firebaseReady = false;
}