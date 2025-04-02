import { format, parseISO, isValid, addDays, addMonths } from "date-fns"

// Format date to display format
export function formatDate(date: string | Date, formatString = "PPP"): string {
  if (!date) return "Invalid date"

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return "Invalid date"
    return format(dateObj, formatString)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

// Format date only (without time) in MM/DD/YYYY format
export function formatDateOnly(date: string | Date): string {
  return formatDate(date, "MM/dd/yyyy")
}

// Format time to display format
export function formatTime(date: string | Date, formatString = "p"): string {
  if (!date) return "Invalid time"

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return "Invalid time"
    return format(dateObj, formatString)
  } catch (error) {
    console.error("Error formatting time:", error)
    return "Invalid time"
  }
}

// Format date and time together
export function formatDateTime(date: string | Date, formatString = "MM/dd/yyyy, h:mm a"): string {
  if (!date) return "Invalid date/time"

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return "Invalid date/time"
    return format(dateObj, formatString)
  } catch (error) {
    console.error("Error formatting date/time:", error)
    return "Invalid date/time"
  }
}

// Get relative time (e.g., "2 days ago")
export function getRelativeTime(date: string | Date): string {
  if (!date) return "Invalid date"

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return "Invalid date"

    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  } catch (error) {
    console.error("Error calculating relative time:", error)
    return "Invalid date"
  }
}

// Get future date
export function getFutureDate(days = 0, months = 0): Date {
  const today = new Date()
  let result = today

  if (days) result = addDays(result, days)
  if (months) result = addMonths(result, months)

  return result
}

// Check if date is in the past
export function isPastDate(date: string | Date): boolean {
  if (!date) return false

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return false

    return dateObj < new Date()
  } catch (error) {
    console.error("Error checking if date is in the past:", error)
    return false
  }
}

// Check if date is in the future
export function isFutureDate(date: string | Date): boolean {
  if (!date) return false

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return false

    return dateObj > new Date()
  } catch (error) {
    console.error("Error checking if date is in the future:", error)
    return false
  }
}

