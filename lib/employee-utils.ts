import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore"

// Define the Employee interface
export interface Employee {
  streetAddress1: string
  streetAddress2: string
  barangay: string
  province: string
  zipCode: string
  dateOfBirth(dateOfBirth: any): import("react").ReactNode
  workingSince(workingSince: any): import("react").ReactNode
  id: string
  firstName: string
  lastName: string
  username: string
  gender: string;
  role: "Administrator" | "Lead Mechanic" | "Assistant Mechanic" | "Helper Mechanic"
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  status: "Active" | "Inactive" | "Terminated"
  dateHired: string
  currentReservation?: string | null
  avatar?: string
}

// Function to generate the next employee ID
export async function generateEmployeeId(): Promise<string> {
  try {
    // Get all employees ordered by ID in descending order
    const employeesRef = collection(db, "employees")
    const q = query(employeesRef, orderBy("id", "desc"), limit(1))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // If no employees exist, start with EMP_001
      return "EMP_001"
    }

    // Get the latest employee ID
    const latestEmployee = snapshot.docs[0].data()
    const latestId = latestEmployee.id

    // Extract the numeric part
    const matches = latestId.match(/EMP_(\d+)/)
    if (!matches || matches.length < 2) {
      return "EMP_001" // Fallback if format doesn't match
    }

    // Increment the number and pad with zeros
    const nextNum = Number.parseInt(matches[1]) + 1
    return `EMP_${nextNum.toString().padStart(3, "0")}`
  } catch (error) {
    console.error("Error generating employee ID:", error)
    throw error
  }
}

// Function to add a new employee
export async function addEmployee(employeeData: Omit<Employee, "id">): Promise<string> {
  try {
    // Generate a new ID
    const id = await generateEmployeeId()

    // Create the employee document
    const employeeRef = doc(db, "employees", id)
    await setDoc(employeeRef, {
      id,
      ...employeeData,
      createdAt: new Date(),
    })

    return id
  } catch (error) {
    console.error("Error adding employee:", error)
    throw error
  }
}

// Function to get all employees
export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const employeesRef = collection(db, "employees")
    const q = query(employeesRef, orderBy("id", "asc"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => doc.data() as Employee)
  } catch (error) {
    console.error("Error getting employees:", error)
    throw error
  }
}

// Function to get only active employees
export async function getActiveEmployees(): Promise<Employee[]> {
  try {
    const employeesRef = collection(db, "employees")
    const q = query(employeesRef, orderBy("id", "asc"))
    const snapshot = await getDocs(q)

    // Filter to only include active employees
    return snapshot.docs.map((doc) => doc.data() as Employee).filter((employee) => employee.status === "Active")
  } catch (error) {
    console.error("Error getting active employees:", error)
    throw error
  }
}

// Function to get an employee by ID
export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const employeeRef = doc(db, "employees", id)
    const employeeDoc = await getDoc(employeeRef)

    if (!employeeDoc.exists()) {
      return null
    }

    return employeeDoc.data() as Employee
  } catch (error) {
    console.error("Error getting employee:", error)
    throw error
  }
}

// Function to update an employee
export async function updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
  try {
    const employeeRef = doc(db, "employees", id)
    await updateDoc(employeeRef, {
      ...data,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating employee:", error)
    throw error
  }
}

// Function to delete an employee
export async function deleteEmployee(id: string): Promise<void> {
  try {
    const employeeRef = doc(db, "employees", id)
    await deleteDoc(employeeRef)
  } catch (error) {
    console.error("Error deleting employee:", error)
    throw error
  }
}

