"use client"

import { useEffect, useState } from "react"

function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize state with initialValue
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Only load from localStorage on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const item = localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
  }, [key]) // Only depend on key, not initialValue

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Get the new value
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Update state
      setStoredValue(valueToStore)

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}

export default useLocalStorage

