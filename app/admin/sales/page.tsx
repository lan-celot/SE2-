"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DashboardHeader } from "@/components/admin-components/header"
import { Sidebar } from "@/components/admin-components/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin-components/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { SalesReportTable } from "./sales-report-table"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore"
import Loading from "@/components/admin-components/loading"

interface Transaction {
  id: string
  totalPrice: number
  createdAt: Date | Timestamp
  paymentMethod?: string
  // Add any other fields you need
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("sales")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [periodFilter, setPeriodFilter] = useState("daily")
  const [chartData, setChartData] = useState<any[]>([])
  
  // Stats for the metrics cards
  const [totalSales, setTotalSales] = useState(0)
  const [dailySales, setDailySales] = useState(0)
  const [weeklySales, setWeeklySales] = useState(0)
  const [yearlySales, setYearlySales] = useState(0)
  
  // Stats for day navigation (only needed for the UI, not actual data)
  const [currentDay, setCurrentDay] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState("THIS WEEK")
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Fetch transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const transactionsRef = collection(db, "transactions")
        const q = query(transactionsRef, orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)
        
        const fetchedTransactions: Transaction[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          
          // Convert Firestore timestamp to JavaScript Date
          let createdAt: Date
          if (data.createdAt && data.createdAt.toDate) {
            createdAt = data.createdAt.toDate()
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt
          } else {
            createdAt = new Date() // Fallback to current date if no date is available
          }
          
          fetchedTransactions.push({
            id: doc.id,
            totalPrice: data.totalPrice || 0,
            createdAt: createdAt,
            paymentMethod: data.paymentMethod || "CASH",
          })
        })
        
        setTransactions(fetchedTransactions)
        
        // Calculate stats
        calculateStats(fetchedTransactions)
        
        // Generate initial chart data
        generateChartData(fetchedTransactions, "daily")
        
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Calculate stats from transactions
  const calculateStats = (transactions: Transaction[]) => {
    // Calculate total sales (sum of all transaction amounts)
    const total = transactions.reduce((sum, transaction) => sum + (transaction.totalPrice || 0), 0)
    setTotalSales(total)
    
    // Calculate estimated profit (60% of total sales - this is an assumption)
    const estimatedProfit = total * 0.6
    
    // Calculate estimated expenses (40% of total sales - this is an assumption)
    const estimatedExpenses = total * 0.4
    
    // Today's sales
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySales = transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.createdAt instanceof Date ? transaction.createdAt : transaction.createdAt.toDate())
        transactionDate.setHours(0, 0, 0, 0)
        return transactionDate.getTime() === today.getTime()
      })
      .reduce((sum, transaction) => sum + (transaction.totalPrice || 0), 0)
    setDailySales(todaySales)
    
    // This week's sales
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Saturday)
    
    const weeklySales = transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.createdAt instanceof Date ? transaction.createdAt : transaction.createdAt.toDate())
        return transactionDate >= startOfWeek && transactionDate <= endOfWeek
      })
      .reduce((sum, transaction) => sum + (transaction.totalPrice || 0), 0)
    setWeeklySales(weeklySales)
    
    // This year's sales
    const currentYear = today.getFullYear()
    const yearlySales = transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.createdAt instanceof Date ? transaction.createdAt : transaction.createdAt.toDate())
        return transactionDate.getFullYear() === currentYear
      })
      .reduce((sum, transaction) => sum + (transaction.totalPrice || 0), 0)
    setYearlySales(yearlySales)
  }

  // Generate chart data based on the selected period
  const generateChartData = (transactions: Transaction[], period: string) => {
    let data: any[] = []
    const today = new Date()
    
    if (period === "daily") {
      // Group by hours of the day
      const hourlyData: Record<number, number> = {}
      
      // Initialize all hours with 0
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = 0
      }
      
      // Filter transactions from today
      const todayStart = new Date(today)
      todayStart.setHours(0, 0, 0, 0)
      
      transactions
        .filter(transaction => {
          const transactionDate = transaction.createdAt instanceof Date 
            ? transaction.createdAt 
            : transaction.createdAt.toDate()
          return transactionDate >= todayStart
        })
        .forEach(transaction => {
          const transactionDate = transaction.createdAt instanceof Date 
            ? transaction.createdAt 
            : transaction.createdAt.toDate()
          const hour = transactionDate.getHours()
          hourlyData[hour] += transaction.totalPrice || 0
        })
      
      // Convert to array format for the chart
      data = Object.entries(hourlyData).map(([hour, value]) => ({
        name: `${hour}:00`,
        value: value
      }))
      
    } else if (period === "weekly") {
      // Group by days of the week
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const dailyData: Record<number, number> = {}
      
      // Initialize all days with 0
      for (let i = 0; i < 7; i++) {
        dailyData[i] = 0
      }
      
      // Get start of the week (Sunday)
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      // Get end of the week (Saturday)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      transactions
        .filter(transaction => {
          const transactionDate = transaction.createdAt instanceof Date 
            ? transaction.createdAt 
            : transaction.createdAt.toDate()
          return transactionDate >= startOfWeek && transactionDate <= endOfWeek
        })
        .forEach(transaction => {
          const transactionDate = transaction.createdAt instanceof Date 
            ? transaction.createdAt 
            : transaction.createdAt.toDate()
          const day = transactionDate.getDay() // 0 = Sunday, 1 = Monday, etc.
          dailyData[day] += transaction.totalPrice || 0
        })
      
      // Convert to array format for the chart
      data = Object.entries(dailyData).map(([day, value]) => ({
        name: dayNames[parseInt(day)],
        value: value
      }))
      
    } else if (period === "monthly") {
      // Group by days of the month
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      const dailyData: Record<number, number> = {}
      
      // Initialize all days with 0
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = 0
      }
      
      // Get start of the month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      
      // Get end of the month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      
      transactions
        .filter(transaction => {
          const transactionDate = transaction.createdAt instanceof Date 
            ? transaction.createdAt 
            : transaction.createdAt.toDate()
          return transactionDate >= startOfMonth && transactionDate <= endOfMonth
        })
        .forEach(transaction => {
          const transactionDate = transaction.createdAt instanceof Date 
            ? transaction.createdAt 
            : transaction.createdAt.toDate()
          const day = transactionDate.getDate()
          dailyData[day] += transaction.totalPrice || 0
        })
      
      // Convert to array format for the chart
      data = Object.entries(dailyData).map(([day, value]) => ({
        name: day,
        value: value
      }))
      
    } else if (period === "yearly") {
      // Group by months of the year
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const monthlyData: Record<number, number> = {}
      
      // Initialize all months with 0
      for (let i = 0; i < 12; i++) {
        monthlyData[i] = 0
      }
      
      // Get start of the year
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      
      // Get end of the year
      const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
      
      transactions
        .filter(transaction => {
          const transactionDate = transaction.createdAt instanceof Date 
            ? transaction.createdAt 
            : transaction.createdAt.toDate()
          return transactionDate >= startOfYear && transactionDate <= endOfYear
        })
        .forEach(transaction => {
          const transactionDate = transaction.createdAt instanceof Date 
            ? transaction.createdAt 
            : transaction.createdAt.toDate()
          const month = transactionDate.getMonth()
          monthlyData[month] += transaction.totalPrice || 0
        })
      
      // Convert to array format for the chart
      data = Object.entries(monthlyData).map(([month, value]) => ({
        name: monthNames[parseInt(month)],
        value: value
      }))
    }
    
    setChartData(data)
  }

  // Handle period change for the chart
  const handlePeriodChange = (period: string) => {
    setPeriodFilter(period)
    generateChartData(transactions, period)
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  // Navigation functions for the date selectors
  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDay)
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDay(newDate)
    
    // In a real implementation, you'd refetch data for the new day
    // For now, we'll just simulate with random data
    const randomAmount = Math.floor(Math.random() * 50000) + 10000
    setDailySales(randomAmount)
  }
  
  const navigateWeek = (direction: "prev" | "next") => {
    // In a real implementation, you'd track and change the actual week
    // For now, we'll just update the display text
    if (direction === "prev") {
      setCurrentWeek("LAST WEEK")
    } else {
      setCurrentWeek("NEXT WEEK")
    }
    
    // Simulate data change
    const randomAmount = Math.floor(Math.random() * 500000) + 100000
    setWeeklySales(randomAmount)
  }
  
  const navigateYear = (direction: "prev" | "next") => {
    const newYear = direction === "prev" ? currentYear - 1 : currentYear + 1
    setCurrentYear(newYear)
    
    // Simulate data change
    const randomAmount = Math.floor(Math.random() * 2000000) + 1000000
    setYearlySales(randomAmount)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Sales Report" />
          </div>
          <div className="flex justify-center items-center h-64">
            <Loading />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Sales Report" />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("sales")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sales"
                  ? "border-[#2a69ac] text-[#2a69ac]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "report"
                  ? "border-[#2a69ac] text-[#2a69ac]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Report
            </button>
          </nav>
        </div>

        {activeTab === "sales" ? (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Total Sales</h3>
                <p className="text-[#1A365D] text-3xl font-bold">{formatCurrency(totalSales)}</p>
                <p className="text-[#8B909A] text-sm">as of today</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Total Profit</h3>
                <p className="text-[#1A365D] text-3xl font-bold">{formatCurrency(totalSales * 0.6)}</p>
                <p className="text-[#8B909A] text-sm">estimated (60% of sales)</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Total Expenses</h3>
                <p className="text-[#1A365D] text-3xl font-bold">{formatCurrency(totalSales * 0.4)}</p>
                <p className="text-[#8B909A] text-sm">estimated (40% of sales)</p>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[#2A69AC] text-2xl font-semibold">Sales</h3>
                <Select value={periodFilter} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">DAILY</SelectItem>
                    <SelectItem value="weekly">WEEKLY</SelectItem>
                    <SelectItem value="monthly">MONTHLY</SelectItem>
                    <SelectItem value="yearly">YEARLY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => 
                        value >= 1000 ? `₱${value / 1000}k` : `₱${value}`
                      } 
                    />
                    <Tooltip 
                      formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0F60FF" 
                      strokeWidth={2} 
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Daily Sales</h3>
                <p className="text-[#1A365D] text-3xl font-bold mb-4">{formatCurrency(dailySales)}</p>
                <div className="flex items-center justify-between text-[#8B909A]">
                  <button className="hover:text-[#1A365D]" onClick={() => navigateDay("prev")}>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">
                    {currentDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button className="hover:text-[#1A365D]" onClick={() => navigateDay("next")}>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Weekly Sales</h3>
                <p className="text-[#1A365D] text-3xl font-bold mb-4">{formatCurrency(weeklySales)}</p>
                <div className="flex items-center justify-between text-[#8B909A]">
                  <button className="hover:text-[#1A365D]" onClick={() => navigateWeek("prev")}>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">{currentWeek}</span>
                  <button className="hover:text-[#1A365D]" onClick={() => navigateWeek("next")}>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Yearly Sales</h3>
                <p className="text-[#1A365D] text-3xl font-bold mb-4">{formatCurrency(yearlySales)}</p>
                <div className="flex items-center justify-between text-[#8B909A]">
                  <button className="hover:text-[#1A365D]" onClick={() => navigateYear("prev")}>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">{currentYear}</span>
                  <button className="hover:text-[#1A365D]" onClick={() => navigateYear("next")}>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <SalesReportTable />
        )}
      </main>
    </div>
  )
}