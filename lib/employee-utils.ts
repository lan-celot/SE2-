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
  id: string // EMP_001 format
  firstName: string
  lastName: string
  username: string
  role: "Administrator" | "Lead Mechanic" | "Assistant Mechanic" | "Helper Mechanic"
  phone: string
  dateOfBirth: string
  gender: "Male" | "Female" | "Other"
  workingSince: string
  streetAddress1: string
  streetAddress2?: string
  barangay: string
  city: string
  province: string
  zipCode: string
  status: "Active" | "Inactive" | "Working" | "Terminated"
  email?: string
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

// Initial employees data
export const initialEmployees: Omit<Employee, "id">[] = [
  {
    firstName: "Marcial",
    lastName: "Tamondong",
    username: "mar",
    role: "Administrator",
    phone: "09171840615",
    dateOfBirth: "1985-06-15",
    gender: "Male",
    workingSince: "2011-11-09",
    streetAddress1: "Block 1 Lot 20 Danarose Residences",
    streetAddress2: "",
    barangay: "Molino",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    status: "Active",
    email: "marcial@marnor.com",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Nor",
    lastName: "Tamondong",
    username: "nor",
    role: "Administrator",
    phone: "09171234567",
    dateOfBirth: "1987-08-20",
    gender: "Male",
    workingSince: "2011-11-09",
    streetAddress1: "Block 1 Lot 20 Danarose Residences",
    streetAddress2: "",
    barangay: "Molino",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    status: "Active",
    email: "nor@marnor.com",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Tim",
    lastName: "Duncan",
    username: "timmy",
    role: "Lead Mechanic",
    phone: "09189876543",
    dateOfBirth: "1976-04-25",
    gender: "Male",
    workingSince: "2015-06-10",
    streetAddress1: "123 Main Street",
    streetAddress2: "Unit 5",
    barangay: "San Antonio",
    city: "Imus",
    province: "Cavite",
    zipCode: "4103",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Manu",
    lastName: "Ginobili",
    username: "manu",
    role: "Assistant Mechanic",
    phone: "09187654321",
    dateOfBirth: "1977-07-28",
    gender: "Male",
    workingSince: "2016-03-15",
    streetAddress1: "456 Oak Avenue",
    streetAddress2: "",
    barangay: "Alapan",
    city: "Imus",
    province: "Cavite",
    zipCode: "4103",
    status: "Working",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Stephen",
    lastName: "Curry",
    username: "steph",
    role: "Assistant Mechanic",
    phone: "09123456789",
    dateOfBirth: "1988-03-14",
    gender: "Male",
    workingSince: "2018-05-20",
    streetAddress1: "789 Pine Street",
    streetAddress2: "Apt 3B",
    barangay: "Bayanan",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    status: "Inactive",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Luka",
    lastName: "Doncic",
    username: "luka",
    role: "Assistant Mechanic",
    phone: "09234567890",
    dateOfBirth: "1999-02-28",
    gender: "Male",
    workingSince: "2020-01-15",
    streetAddress1: "101 Maple Road",
    streetAddress2: "",
    barangay: "Niog",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Anthony",
    lastName: "Edwards",
    username: "ant",
    role: "Helper Mechanic",
    phone: "09345678901",
    dateOfBirth: "2001-08-05",
    gender: "Male",
    workingSince: "2021-07-10",
    streetAddress1: "202 Cedar Lane",
    streetAddress2: "",
    barangay: "Habay",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    status: "Working",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Donovan",
    lastName: "Mitchell",
    username: "spida",
    role: "Helper Mechanic",
    phone: "09456789012",
    dateOfBirth: "1996-09-07",
    gender: "Male",
    workingSince: "2022-02-28",
    streetAddress1: "303 Birch Street",
    streetAddress2: "Unit 7C",
    barangay: "Talaba",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Kobe",
    lastName: "Bryant",
    username: "kobeeee",
    role: "Lead Mechanic",
    phone: "09567890123",
    dateOfBirth: "1978-08-23",
    gender: "Male",
    workingSince: "2014-01-15",
    streetAddress1: "404 Elm Street",
    streetAddress2: "",
    barangay: "Zapote",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    status: "Terminated",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    firstName: "Ray",
    lastName: "Allen",
    username: "ray",
    role: "Lead Mechanic",
    phone: "09678901234",
    dateOfBirth: "1975-07-20",
    gender: "Male",
    workingSince: "2015-03-10",
    streetAddress1: "505 Walnut Avenue",
    streetAddress2: "Apt 12",
    barangay: "Niog",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    status: "Inactive",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

// Function to initialize the employees collection with sample data
export async function initializeEmployeesCollection(): Promise<void> {
  try {
    // Check if collection is already initialized
    const employeesRef = collection(db, "employees")
    const snapshot = await getDocs(employeesRef)

    if (!snapshot.empty) {
      console.log("Employees collection already initialized")
      return
    }

    console.log("Initializing employees collection...")

    // Add Marcial as EMP_001
    const marcialRef = doc(db, "employees", "EMP_001")
    await setDoc(marcialRef, {
      id: "EMP_001",
      ...initialEmployees[0],
      createdAt: new Date(),
    })

    // Add the rest of the employees with generated IDs
    for (let i = 1; i < initialEmployees.length; i++) {
      const id = `EMP_${(i + 1).toString().padStart(3, "0")}`
      const employeeRef = doc(db, "employees", id)
      await setDoc(employeeRef, {
        id,
        ...initialEmployees[i],
        createdAt: new Date(),
      })
    }

    console.log("Employees collection initialized successfully")
  } catch (error) {
    console.error("Error initializing employees collection:", error)
    throw error
  }
}

