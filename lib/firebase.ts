// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBoTY0dw2X3vvNNN36ajHvZpO926eHCebY",
  authDomain: "autotrack-3982e.firebaseapp.com",
  projectId: "autotrack-3982e",
  storageBucket: "autotrack-3982e.firebasestorage.app",
  messagingSenderId: "197356954496",
  appId: "1:197356954496:web:9df3e88b7bb6eba35b9765",
  measurementId: "G-BLJNBPYQ3N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Function to register a new user
export const registerUser = async (
  email: string, 
  password: string, 
  userData: {
    firstName: string, 
    lastName: string, 
    username: string, 
    phone: string, 
    gender: string, 
    dateOfBirth: string
  }
) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store additional user info in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      ...userData
    });

    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Function to login user
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};