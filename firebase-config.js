/* ============================================================
   firebase-config.js  –  Konfigurasi Firebase project ulangan-sekolah
   ============================================================ */

var firebaseConfig = {
  apiKey:            "AIzaSyBmN4_nzxxUez99ggBW-pIGfAbtAE0upWc",
  authDomain:        "ulangan-sekolah.firebaseapp.com",
  databaseURL:       "https://ulangan-sekolah-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "ulangan-sekolah",
  storageBucket:     "ulangan-sekolah.firebasestorage.app",
  messagingSenderId: "619921511066",
  appId:             "1:619921511066:web:4b944d6b9eff8bbe0e4523",
  measurementId:     "G-JWQEGCFRZH"
};

firebase.initializeApp(firebaseConfig);

/* Referensi ke Realtime Database */
var db = firebase.database();
