"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Copy, ChevronUp, ChevronDown, UserCircle2 } from "lucide-react"
import { DashboardHeader } from "@/components/admin-components/header"
import { Sidebar } from "@/components/admin-components/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/admin-components/button"
import React from "react"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { formatDateTime, formatDateOnly } from "@/lib/date-utils"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore"

interface Customer {
  id: string
  uid: string
  name: string
  firstName: string
  lastName: string
  username?: string
  email: string
  phone: string
  gender?: string
  dateOfBirth?: string
  memberSince?: string
  address?: {
    street?: string
    city?: string
    province?: string
    zipCode?: string
  }
  stats?: {
    completed: number
    ongoing: number
    confirmed: number
  }
}

interface Service {
  employeeId?: string;
  mechanic?: string;
  service: string;
  status?: "CONFIRMED" | "COMPLETED" | string;
}

interface Booking {
  id: string
  date: string
  carModel: string
  status: "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED" | string
  completionDate?: string
  services?: Service[]
}

const statusStyles: Record<string, string> = {
  CONFIRMED: "bg-[#EBF8FF] text-[#63B3ED]",
  REPAIRING: "bg-[#FFF5E0] text-[#FFC600]",
  COMPLETED: "bg-[#E6FFF3] text-[#28C76F]",
  CANCELLED: "bg-[#FFE5E5] text-[#EA5455]",
  PENDING: "bg-gray-100 text-gray-600", // Add default status
}

const tabs = ["All", "CONFIRMED", "REPAIRING", "COMPLETED", "CANCELLED"]

export default function CustomerDetailsPage() {
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sortField, setSortField] = useState<keyof Omit<Booking, "services">>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = useResponsiveRows();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchCustomerData();
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
        setLoading(false);
      }
    };

    async function fetchCustomerData() {
      try {
        setLoading(true);
        const customerId = params.id as string;
        console.log("Fetching customer data for ID:", customerId);
        
        let userData;
        let accountDocRef;
        let memberSinceDate;

        // Try to directly fetch the customer document first from accounts collection
        try {
          // Direct document access is faster if document ID matches customerId
          accountDocRef = doc(db, "accounts", customerId);
          const customerDoc = await getDoc(accountDocRef);
          if (customerDoc.exists()) {
            userData = customerDoc.data();
            // Get the creation timestamp from the document
            memberSinceDate = userData.createdAt;
            await processCustomerData(userData, customerId, memberSinceDate);
            return;
          }
        } catch (error) {
          console.log("Error fetching direct document, falling back to query", error);
        }

        try {
          // Fetch customer data from accounts collection using query
          const accountsRef = collection(db, "accounts");
          const accountsQuery = query(accountsRef, where("uid", "==", customerId));
          const accountsSnapshot = await getDocs(accountsQuery);
  
          if (!accountsSnapshot.empty) {
            accountDocRef = accountsSnapshot.docs[0].ref;
            userData = accountsSnapshot.docs[0].data();
            // Get the creation timestamp from the document
            memberSinceDate = userData.createdAt;
            await processCustomerData(userData, customerId, memberSinceDate);
            return;
          } else {
            console.log("No user found in accounts collection with ID:", customerId);
          }
        } catch (error) {
          console.error("Error fetching from accounts by uid:", error);
        }
        
        // One more fallback - try users collection
        try {
          const usersRef = collection(db, "users");
          const usersQuery = query(usersRef, where("uid", "==", customerId));
          const usersSnapshot = await getDocs(usersQuery);
          
          if (!usersSnapshot.empty) {
            userData = usersSnapshot.docs[0].data();
            // Try to get creation timestamp
            memberSinceDate = userData.createdAt || userData.created || new Date().toISOString();
            await processCustomerData(userData, customerId, memberSinceDate);
            return;
          } else {
            console.log("No user found in users collection with ID:", customerId);
            setLoading(false);
          }
        } catch (finalError) {
          console.error("All user fetch attempts failed:", finalError);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in main fetchCustomerData function:", error);
        setLoading(false);
      }
    }

    async function processCustomerData(userData: any, customerId: string, memberSinceDate: any) {
      console.log("Found user:", userData.firstName, userData.lastName);

      // Fetch customer's bookings - handle differently to avoid index requirements
      const bookingsRef = collection(db, "bookings");
      
      try {
        // First try without orderBy to avoid index requirements
        const bookingsQuerySimple = query(bookingsRef, where("customerId", "==", customerId));
        let bookingsSnapshot = await getDocs(bookingsQuerySimple);
        
        // If no bookings found with customerId, try with userId
        if (bookingsSnapshot.empty) {
          console.log("No bookings found with customerId, trying userId");
          const bookingsQueryAlt = query(bookingsRef, where("userId", "==", customerId));
          bookingsSnapshot = await getDocs(bookingsQueryAlt);
        }
        
        // Sort in memory after fetching
        const bookings = bookingsSnapshot.docs.map(doc => ({
          docRef: doc.ref,
          data: doc.data(),
          id: doc.id
        }));
        
        // Sort the docs by date in memory
        bookings.sort((a, b) => {
          const dateA = a.data.date || a.data.reservationDate || new Date(0);
          const dateB = b.data.date || b.data.reservationDate || new Date(0);
          
          // Handle string dates or timestamps
          const timestampA = typeof dateA === 'string' ? new Date(dateA).getTime() : 
                            dateA?.toDate ? dateA.toDate().getTime() : 0;
          
          const timestampB = typeof dateB === 'string' ? new Date(dateB).getTime() : 
                            dateB?.toDate ? dateB.toDate().getTime() : 0;
          
          return timestampB - timestampA; // descending order
        });
        
        // Replace the bookingsSnapshot with our sorted result
        bookingsSnapshot = {
          docs: bookings.map(b => ({
            id: b.id,
            data: () => b.data,
            ref: b.docRef
          })),
          empty: bookings.length === 0,
          size: bookings.length
        } as any;

        console.log(`Found ${bookingsSnapshot.size} bookings for customer`);

        const customerBookings: Booking[] = [];
        const employeeIds: string[] = [];
        
        // Collect all employee IDs first to fetch them in batch
        bookingsSnapshot.docs.forEach(doc => {
          const bookingData = doc.data();
          const services = bookingData.services || [];
          
          services.forEach((service: any) => {
            if (typeof service !== 'string' && service.employeeId) {
              if (!employeeIds.includes(service.employeeId)) {
                employeeIds.push(service.employeeId);
              }
            }
          });
        });
        
        // Fetch employee data if we have any employee IDs
        const employeesData: Record<string, any> = {};
        if (employeeIds.length > 0) {
          try {
            // Fetch employees in batches of 10 (Firestore limit for 'in' queries)
            for (let i = 0; i < employeeIds.length; i += 10) {
              const batch = employeeIds.slice(i, i + 10);
              const employeesRef = collection(db, "employees");
              // Use 'in' query to get multiple employees at once
              const employeesQuery = query(employeesRef, where("__name__", "in", batch));
              const employeesSnapshot = await getDocs(employeesQuery);
              
              employeesSnapshot.forEach(doc => {
                employeesData[doc.id] = doc.data();
              });
            }
          } catch (error) {
            console.error("Error fetching employee data:", error);
          }
        }

        bookingsSnapshot.docs.forEach((doc) => {
          const bookingData = doc.data();
          
          // Handle Firebase timestamp objects by converting to date strings
          let bookingDate = bookingData.date || bookingData.reservationDate;
          if (bookingDate && typeof bookingDate !== 'string') {
            // Check if it's a Firebase timestamp
            if (bookingDate.toDate && typeof bookingDate.toDate === 'function') {
              bookingDate = bookingDate.toDate().toISOString();
            }
          }
          
          // Get completion date directly from the booking
          let completionDate = bookingData.completionDate;
          if (completionDate && typeof completionDate !== 'string') {
            // Check if it's a Firebase timestamp
            if (completionDate.toDate && typeof completionDate.toDate === 'function') {
              completionDate = completionDate.toDate().toISOString();
            }
          }
          
          // Process services to ensure they match expected format
          const services = (bookingData.services || []).map((service: any) => {
            // Handle if service is just a string
            if (typeof service === 'string') {
              return {
                service: service,
                mechanic: "Unassigned",
                employeeId: "",
                status: "CONFIRMED"
              };
            }
            
            // Ensure employee data is properly formatted
            let mechanic = service.mechanic || "Unassigned";
            const employeeId = service.employeeId || "";
            
            // If we have employee data for this ID, update the mechanic name
            if (employeeId && employeesData[employeeId]) {
              const employeeData = employeesData[employeeId];
              mechanic = `${employeeData.firstName || ""} ${employeeData.lastName || ""}`.trim() || mechanic;
            }
            
            return {
              ...service,
              mechanic,
              employeeId,
              // Ensure status is properly capitalized for consistency
              status: service.status ? service.status.toUpperCase() : "CONFIRMED"
            };
          });
          
          // Ensure status is properly capitalized for consistency
          const status = bookingData.status ? bookingData.status.toUpperCase() : "PENDING";
          
          customerBookings.push({
            id: doc.id, // Use the actual document ID as requested
            date: bookingDate || new Date().toISOString(),
            carModel: bookingData.carModel || "N/A",
            status: status,
            completionDate: completionDate,
            services: services,
          });
        });

        // Calculate stats with correct status capitalization
        const stats = {
          completed: customerBookings.filter((r) => r.status === "COMPLETED").length,
          ongoing: customerBookings.filter((r) => r.status === "REPAIRING").length,
          confirmed: customerBookings.filter((r) => r.status === "CONFIRMED").length,
        };

        // Format member since date
        let formattedMemberSince = memberSinceDate;
        if (memberSinceDate && typeof memberSinceDate !== 'string') {
          if (memberSinceDate.toDate && typeof memberSinceDate.toDate === 'function') {
            formattedMemberSince = memberSinceDate.toDate().toISOString();
          }
        }

        // Create customer object
        const customerObj: Customer = {
          id: `#C${String(parseInt(userData.index || "0") + 91).padStart(5, "0")}`,
          uid: userData.uid || customerId,
          name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          username: userData.username || "",
          email: userData.email || "",
          phone: userData.phone || userData.phoneNumber || "N/A",
          gender: userData.gender || "",
          dateOfBirth: userData.dateOfBirth || "",
          memberSince: formattedMemberSince || new Date().toISOString(),
          address: {
            street: userData.address?.street || userData.street || "",
            city: userData.address?.city || userData.city || "",
            province: userData.address?.province || userData.province || "",
            zipCode: userData.address?.zipCode || userData.zipCode || "",
          },
          stats,
        };

        setCustomer(customerObj);
        setBookings(customerBookings);
      } catch (error) {
        console.error("Error processing customer data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Customer Details" />
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2A69AC]"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Customer Details" />
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <p className="text-[#8B909A] text-lg">No Customer Details Found</p>
          </div>
        </main>
      </div>
    );
  }

  const handleSort = (field: keyof Omit<Booking, "services">) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredBookings = bookings
    .filter((booking) => activeTab === "All" || booking.status === activeTab)
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortOrder === "asc" ? 1 : -1;

      if (sortField === "id") {
        // For string IDs, just use standard string comparison
        return String(aValue).localeCompare(String(bValue)) * modifier;
      }

      if (sortField === "date" || sortField === "completionDate") {
        return (new Date(aValue as string).getTime() - new Date(bValue as string).getTime()) * modifier;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * modifier;
      }

      return 0;
    });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentItems = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Customer Details" />
        </div>

        <div className="grid gap-8">
          {/* Customer Profile */}
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <UserCircle2 className="h-12 w-12" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-[#2A69AC] uppercase">{customer?.name}</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-[#8B909A] uppercase">{customer?.username || customer?.email}</p>
                        <span className="text-[#8B909A]">•</span>
                        <p className="text-[#8B909A] uppercase">{customer?.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Contact Number</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[#1A365D]">{customer?.phone}</p>
                        <Button variant="ghost" size="icon" className="h-4 w-4">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Gender</p>
                      <p className="text-[#1A365D]">{customer?.gender || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Date of Birth</p>
                      <p className="text-[#1A365D]">
                        {customer?.dateOfBirth ? formatDateOnly(customer.dateOfBirth) : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Member Since</p>
                      <p className="text-[#1A365D]">
                        {customer?.memberSince ? formatDateOnly(customer.memberSince) : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-2xl font-semibold text-[#2A69AC]">Address</h3>
              {customer?.address && (customer.address.street || customer.address.city) ? (
                <>
                  <p className="text-[#1A365D] uppercase">{customer.address.street || "No street address"}</p>
                  <p className="text-[#1A365D] uppercase">
                    {customer.address.city || "No city"}, {customer.address.province || "No province"}{" "}
                    {customer.address.zipCode || ""}
                  </p>
                </>
              ) : (
                <p className="text-[#8B909A]">No address information</p>
              )}

              <h3 className="mt-8 mb-4 text-2xl font-semibold text-[#2A69AC]">Bookings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{customer?.stats?.completed || 0}</p>
                  <p className="text-sm text-[#8B909A]">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{customer?.stats?.ongoing || 0}</p>
                  <p className="text-sm text-[#8B909A]">Repairing</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{customer?.stats?.confirmed || 0}</p>
                  <p className="text-sm text-[#8B909A]">Confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <nav className="flex space-x-8 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                    activeTab === tab
                      ? "border-[#2a69ac] text-[#2a69ac]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Bookings Table */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            {filteredBookings.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-[#8B909A] text-lg">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {[
                        { key: "id", label: "RESERVATION ID", width: "15%" },
                        { key: "date", label: "RESERVATION DATE", width: "20%" },
                        { key: "carModel", label: "CAR MODEL", width: "20%" },
                        { key: "status", label: "STATUS", width: "15%" },
                        { key: "completionDate", label: "COMPLETION DATE", width: "20%" },
                        { key: "action", label: "ACTION", width: "10%" },
                      ].map((column) => (
                        <th
                          key={column.key}
                          className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                          style={{ width: column.width }}
                        >
                          {column.key !== "action" && column.key !== "status" ? (
                            <button
                              className="flex items-center justify-center gap-1 hover:text-[#1A365D] mx-auto"
                              onClick={() => handleSort(column.key as keyof Omit<Booking, "services">)}
                            >
                              {column.label}
                              <div className="flex flex-col">
                                <ChevronUp
                                  className={cn(
                                    "h-3 w-3",
                                    sortField === column.key && sortOrder === "asc"
                                      ? "text-[#1A365D]"
                                      : "text-[#8B909A]",
                                  )}
                                />
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3",
                                    sortField === column.key && sortOrder === "desc"
                                      ? "text-[#1A365D]"
                                      : "text-[#8B909A]",
                                  )}
                                />
                              </div>
                            </button>
                          ) : (
                            column.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((booking, index) => (
                      <React.Fragment key={`${booking.id}-${index}`}>
                        <tr
                          className={cn(
                            "hover:bg-gray-50",
                            expandedRow && expandedRow !== booking.id && "opacity-50",
                            "transition-opacity duration-200",
                          )}
                        >
                          <td className="px-3 py-2 text-sm text-[#1A365D] text-center truncate uppercase">
                            {booking.id}
                          </td>
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate uppercase"
                            title={formatDateTime(booking.date)}
                          >
                            {formatDateTime(booking.date)}
                          </td>
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate uppercase"
                            title={booking.carModel}
                          >
                            {booking.carModel}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-7 w-[100px] text-sm font-medium rounded-lg",
                                statusStyles[booking.status as keyof typeof statusStyles] || statusStyles["PENDING"],
                                booking.status === "CONFIRMED"
                                  ? "hover:bg-[#BEE3F8] hover:text-[#2B6CB0]"
                                  : booking.status === "REPAIRING"
                                    ? "hover:bg-[#FEEBC8] hover:text-[#D97706]"
                                    : booking.status === "COMPLETED"
                                      ? "hover:bg-[#C6F6D5] hover:text-[#22A366]"
                                      : booking.status === "CANCELLED" 
                                        ? "hover:bg-[#FED7D7] hover:text-[#C53030]"
                                        : "",
                              )}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate"
                            title={booking.completionDate ? formatDateTime(booking.completionDate) : "-"}
                          >
                            {booking.completionDate ? formatDateTime(booking.completionDate) : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setExpandedRow(expandedRow === booking.id ? null : booking.id)}
                            >
                              {expandedRow === booking.id ? (
                                <ChevronUp className="h-5 w-5 text-[#1A365D]" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-[#1A365D]" />
                              )}
                            </Button>
                          </td>
                        </tr>
                        {expandedRow === booking.id && booking.services && booking.services.length > 0 && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50">
                              <div className="px-4 py-2">
                                <table className="w-full table-fixed">
                                  <thead>
                                    <tr>
                                      <th
                                        className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                                        style={{ width: "25%" }}
                                      >
                                        Employee ID
                                      </th>
                                      <th
                                        className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                                        style={{ width: "25%" }}
                                      >
                                        Mechanic
                                      </th>
                                      <th
                                        className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                                        style={{ width: "25%" }}
                                      >
                                        Service
                                      </th>
                                      <th
                                        className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                                        style={{ width: "25%" }}
                                      >
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {booking.services.map((service, index) => (
                                      <tr key={`service-${booking.id}-${index}`}>
                                        <td className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                          {service.employeeId || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                          {service.mechanic || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                          {service.service || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                          <span
                                            className={cn(
                                              "inline-flex items-center justify-center h-7 w-[100px] text-sm font-medium rounded-lg",
                                              statusStyles[service.status as keyof typeof statusStyles] || "bg-gray-100 text-gray-600",
                                              service.status === "CONFIRMED"
                                                ? "hover:bg-[#BEE3F8] hover:text-[#2B6CB0]"
                                                : "hover:bg-[#C6F6D5] hover:text-[#22A366]"
                                            )}
                                          >
                                            {service.status || "-"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex justify-end px-2 py-3 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage(Math.max(1, currentPage - 1));
                      setExpandedRow(null); // Reset expanded row when changing pages
                    }}
                    disabled={currentPage === 1}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm",
                      currentPage === 1 ? "text-[#8B909A] cursor-not-allowed" : "text-[#1A365D] hover:bg-[#EBF8FF]"
                    )}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        setExpandedRow(null); // Reset expanded row when changing pages
                      }}
                      className={cn(
                        "px-3 py-1 rounded-md text-sm",
                        currentPage === page ? "bg-[#1A365D] text-white" : "text-[#1A365D] hover:bg-[#EBF8FF]"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setCurrentPage(Math.min(totalPages, currentPage + 1));
                      setExpandedRow(null); // Reset expanded row when changing pages
                    }}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm",
                      currentPage === totalPages
                        ? "text-[#8B909A] cursor-not-allowed"
                        : "text-[#1A365D] hover:bg-[#EBF8FF]"
                    )}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}