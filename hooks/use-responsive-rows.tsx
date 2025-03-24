"use client"

import { useState, useEffect } from "react"

/**
 * A custom hook that calculates the optimal number of table rows based on screen height.
 *
 * @param headerHeight - Optional height of the header area (default: 200px)
 * @param rowHeight - Optional height of each table row (default: 72px)
 * @param paginationHeight - Optional height of the pagination area (default: 60px)
 * @param minRows - Optional minimum number of rows to display (default: 3)
 * @param maxRows - Optional maximum number of rows to display (default: 12)
 * @returns The optimal number of rows to display
 */
export function useResponsiveRows(
  headerHeight = 200,
  rowHeight = 72,
  paginationHeight = 60,
  minRows = 3,
  maxRows = 12,
): number {
  const [itemsPerPage, setItemsPerPage] = useState(5)

  useEffect(() => {
    // Function to calculate optimal number of rows based on screen height
    const calculateOptimalRows = () => {
      // Get window height
      const windowHeight = window.innerHeight

      // Calculate available height for the table
      const availableHeight = windowHeight - headerHeight - paginationHeight

      // Calculate optimal number of rows (with min and max limits)
      const optimalRows = Math.max(minRows, Math.min(maxRows, Math.floor(availableHeight / rowHeight)))

      // Update state if different
      setItemsPerPage(optimalRows)
    }

    // Calculate on initial render
    calculateOptimalRows()

    // Add resize listener
    window.addEventListener("resize", calculateOptimalRows)

    // Clean up
    return () => window.removeEventListener("resize", calculateOptimalRows)
  }, [headerHeight, rowHeight, paginationHeight, minRows, maxRows])

  return itemsPerPage
}

