import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface LogEntry {
  id?: string
  activity: string
  performedBy: string
  timestamp: any
  logType: LogActionType
  userId?: string
}

export type LogActionType = "LOGIN" | "LOGOUT"

/**
 * Adds a log entry to the logs collection in Firebase
 */
export async function addLogEntry(
  activity: string,
  performedBy: string,
  logType: LogActionType,
  userId?: string,
): Promise<void> {
  try {
    const logEntry: Omit<LogEntry, "id"> = {
      activity,
      performedBy,
      timestamp: serverTimestamp(),
      logType,
    }

    // Only add userId if it's defined
    if (userId) {
      logEntry.userId = userId
    }

    console.log("Attempting to add log entry:", logEntry) // Add this line

    const docRef = await addDoc(collection(db, "logs"), logEntry)
    console.log("Log entry added successfully with ID:", docRef.id) // Add this line
  } catch (error) {
    console.error("Error adding log entry:", error)
  }
}

/**
 * Creates a login log entry
 */
export async function logUserLogin(firstName: string, email: string, userId?: string): Promise<void> {
  const activity = `${firstName} logged in successfully`
  await addLogEntry(activity, email, "LOGIN", userId)
}

/**
 * Creates a logout log entry
 */
export async function logUserLogout(firstName: string, email: string, userId?: string): Promise<void> {
  const activity = `${firstName} logged out`
  await addLogEntry(activity, email, "LOGOUT", userId)
}
