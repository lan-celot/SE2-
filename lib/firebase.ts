import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { getFirestore, doc, setDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBoTY0dw2X3vvNNN36ajHvZpO926eHCebY",
  authDomain: "autotrack-3982e.firebaseapp.com",
  projectId: "autotrack-3982e",
  storageBucket: "autotrack-3982e.firebasestorage.app",
  messagingSenderId: "197356954496",
  appId: "1:197356954496:web:9df3e88b7bb6eba35b9765",
  measurementId: "G-BLJNBPYQ3N",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Modified loginUser function that doesn't throw errors
export const loginUser = async (email: string, password: string) => {
  try {
    console.log("Attempting to login with email:", email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("Login successful for user:", userCredential.user.uid)
    return {
      success: true,
      user: userCredential.user,
    }
  } catch (error) {
    console.error("Firebase login error:", error)
    // Return an error object instead of throwing
    return {
      success: false,
      error: "Invalid credentials",
    }
  }
}

