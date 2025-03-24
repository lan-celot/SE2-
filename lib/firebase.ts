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

// Function to register a new user
export const registerUser = async (
  email: string,
  password: string,
  userData: {
    firstName: string
    lastName: string
    username: string
    phone: string
    gender: string
    dateOfBirth: string
  },
) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Store additional user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      ...userData,
    })

    return user
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

// Update the loginUser function to provide more detailed error information
export const loginUser = async (email: string, password: string) => {
  try {
    console.log("Attempting to login with email:", email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("Login successful for user:", userCredential.user.uid)
    return userCredential.user
  } catch (error) {
    console.error("Firebase login error:", error)
    // Rethrow the error to be handled by the calling function
    throw error
  }
}

