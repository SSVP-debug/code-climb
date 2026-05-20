import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyD2FRu0F5Hpbz_hTqCDo5cAVupR1nZlNr8",
  authDomain: "code-climb-auth.firebaseapp.com",
  projectId: "code-climb-auth",
  storageBucket: "code-climb-auth.firebasestorage.app",
  messagingSenderId: "700712222471",
  appId: "1:700712222471:web:2445367e1129236400cfa2"
};

const app = initializeApp(firebaseConfig);

export default app;