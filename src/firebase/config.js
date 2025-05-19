// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-7tT9pQqsSYaFnmRW5MXIfyR69BrtElI",
  authDomain: "eurovote-wkq5s.firebaseapp.com",
  projectId: "eurovote-wkq5s",
  storageBucket: "eurovote-wkq5s.firebasestorage.app",
  messagingSenderId: "435532211345",
  appId: "1:435532211345:web:5e19b85b3a56026c27cb30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;