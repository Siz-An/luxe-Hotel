// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0tKaXVtfzlzeUHtdKukKIh8Doo3c1Wag",
  authDomain: "bookverse-8ac90.firebaseapp.com",
  projectId: "bookverse-8ac90",
  storageBucket: "bookverse-8ac90.appspot.com",
  messagingSenderId: "808424067899",
  appId: "1:808424067899:web:c6c869e4e3408a23079d1e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };