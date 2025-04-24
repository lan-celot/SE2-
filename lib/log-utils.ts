import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase" // Assuming your Firebase db instance is exported from here

export interface LogEntry {
  id?: string
  activity: string
  performedBy: string
  timestamp: any // Using 'any' to be flexible with serverTimestamp() type
  logType: LogActionType
  userId?: string
}

export type LogActionType = "LOGIN" | "LOGOUT" // Define possible log types

/**
 * Adds a log entry to the logs collection in Firebase
 */
export async function addLogEntry(
  activity: string,
  performedBy: string, // e.g., user's email
  logType: LogActionType,
  userId?: string, // Optional user UID
): Promise<void> {
  try {
    const logEntry: Omit<LogEntry, "id"> = {
      activity,
      performedBy,
      timestamp: serverTimestamp(), // Use serverTimestamp for accurate time
      logType,
    }

    // Only add userId if it's defined
    if (userId) {
      logEntry.userId = userId
    }

    console.log("Attempting to add log entry:", logEntry) // Log before adding
    const docRef = await addDoc(collection(db, "logs"), logEntry)
    console.log("Log entry added successfully with ID:", docRef.id) // Log success
  } catch (error) {
    console.error("Error adding log entry:", error)
  }
}

/**
 * Creates a login log entry
 */
export async function logUserLogin(firstName: string, email: string, userId?: string): Promise<void> {
  console.log("logUserLogin called with:", firstName, email, userId) // Add this line
  const activity = `${firstName} logged in successfully`
  await addLogEntry(activity, email, "LOGIN", userId)
}

/**
 * Creates a logout log entry
 */
export async function logUserLogout(firstName: string, email: string, userId?: string): Promise<void> {
  console.log("logUserLogout called with:", firstName, email, userId) // Add this line
  const activity = `${firstName} logged out`
  await addLogEntry(activity, email, "LOGOUT", userId)
}
