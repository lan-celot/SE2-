"use client"

import { useEffect, useState } from "react"

export function useResponsiveRows(initialRows = 5) {
  const [rows, setRows] = useState(initialRows)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setRows(3) // Small screens
      } else if (width < 1024) {
        setRows(4) // Medium screens
      } else {
        setRows(initialRows) // Large screens
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [initialRows])

  return rows
}

