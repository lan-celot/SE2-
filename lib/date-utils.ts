/**
 * Formats a date string to a consistent format: mm/dd/yyyy hh:mm AM/PM
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export function formatDateTime(dateString: string): string {
    try {
      const date = new Date(dateString)
  
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString // Return original string if invalid date
      }
  
      // Format to mm/dd/yyyy hh:mm AM/PM
      return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString // Return original string if error occurs
    }
  }
  
  /**
   * Formats a date string to date only: mm/dd/yyyy
   * @param dateString The date string to format
   * @returns Formatted date string
   */
  export function formatDateOnly(dateString: string): string {
    try {
      const date = new Date(dateString)
  
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString // Return original string if invalid date
      }
  
      // Format to mm/dd/yyyy
      return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString // Return original string if error occurs
    }
  }
  
  