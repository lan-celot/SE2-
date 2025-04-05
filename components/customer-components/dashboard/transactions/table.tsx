"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { collection, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import React from "react";

interface Service {
  service: string;
  mechanic: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
}

interface Transaction {
  id: string;
  reservationDate: string;
  carModel: string;
  completionDate: string;
  totalPrice: number;
  services?: Service[];
}

type SortField = "id" | "reservationDate" | "carModel" | "completionDate" | "totalPrice";
type SortOrder = "asc" | "desc";

interface TransactionsTableProps {
  searchQuery: string;
  userId?: string;
}

export function TransactionsTable({ searchQuery, userId: propUserId }: TransactionsTableProps) {
  const [isClient, setIsClient] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    if (propUserId) {
      setUserId(propUserId);
      return;
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User authenticated:", user.uid);
        setUserId(user.uid);
      } else {
        console.log("No user authenticated");
        setUserId(null);
        setError("Please log in to view transactions");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [propUserId, isClient]);

  const formatCarModel = (brand: string, model: string): string => {
    if (!brand || !model) return model || "";
    const cleanModel = model.replace(new RegExp(`^${brand}\\s+`, 'i'), '').trim();
    return `${brand} ${cleanModel}`;
  };

  useEffect(() => {
    if (!isClient || !userId) {
      return;
    }

    console.log("Fetching transactions for userId:", userId);
    setLoading(true);
    setError(null);
    
    try {
      const bookingsRef = collection(db, 'bookings');
      
      const unsub = onSnapshot(
        bookingsRef, 
        (snapshot) => {
          console.log("Snapshot received, docs count:", snapshot.docs.length);
          
          if (snapshot.empty) {
            console.log("No transactions found for userId:", userId);
            setTransactionsData([]);
          } else {
            const transactions = snapshot.docs
              .filter(doc => doc.data().userId === userId)
              .map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  reservationDate: data.reservationDate || "",
                  carModel: formatCarModel(data.carBrand || "", data.carModel || ""),
                  completionDate: data.completionDate || "",
                  totalPrice: data.totalPrice || 0,
                  services: data.services || [],
                };
              });
            console.log("Parsed transactions:", transactions.length);
            setTransactionsData(transactions);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching transactions:", err);
          setError("Error loading transactions: " + err.message);
          setLoading(false);
        }
      );
      
      return () => {
        console.log("Cleaning up transaction listener");
        unsub();
      };
    } catch (err) {
      console.error("Exception in transaction setup:", err);
      setError("Failed to set up transaction listener");
      setLoading(false);
      return () => {};
    }
  }, [userId, isClient]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Check if amount is undefined, null, or NaN
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "₱0.00";
    }
    return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredAndSortedTransactions = [...transactionsData]
    .filter((transaction) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          transaction.id.toLowerCase().includes(query) ||
          transaction.carModel.toLowerCase().includes(query) ||
          transaction.reservationDate.toLowerCase().includes(query) ||
          transaction.completionDate.toLowerCase().includes(query) ||
          transaction.totalPrice.toString().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortOrder === "asc" ? 1 : -1;
      if (sortField === "completionDate" || sortField === "reservationDate") {
        return (new Date(aValue).getTime() - new Date(bValue).getTime()) * modifier;
      }
      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0;
    });

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const currentItems = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isClient) {
    return <div className="bg-white rounded-lg shadow-sm p-6 text-center">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="animate-pulse">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-500">{error}</div>
        <div className="mt-4 text-center text-sm text-gray-500">
          If you're already logged in and seeing this error, there might be an issue with the database connection or permissions.
        </div>
      </div>
    );
  }

  if (transactionsData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div>No transactions found.</div>
        <div className="mt-2 text-sm text-gray-500">
          Transactions will appear here once they are added by an admin.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">  
          <thead>
            <tr className="border-b border-gray-200">
              {[
                { key: "id", label: "TRANSACTION ID" },
                { key: "reservationDate", label: "RESERVATION DATE" },
                { key: "carModel", label: "CAR MODEL" },
                { key: "completionDate", label: "COMPLETION DATE" },
                { key: "totalPrice", label: "TOTAL PRICE" },
                { key: "action", label: "ACTION" },
              ].map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                >
                  {column.key !== "action" ? (
                    <button
                      className="flex items-center gap-1 hover:text-[#1A365D]"
                      onClick={() => column.key !== "action" && handleSort(column.key as SortField)}
                    >
                      {column.label}
                      {column.key !== "action" && (
                        <div className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              "h-3 w-3",
                              sortField === column.key && sortOrder === "asc" ? "text-[#1A365D]" : "text-[#8B909A]",
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              "h-3 w-3",
                              sortField === column.key && sortOrder === "desc" ? "text-[#1A365D]" : "text-[#8B909A]",
                            )}
                          />
                        </div>
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentItems.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <tr className={cn("hover:bg-gray-50", expandedRow && expandedRow !== transaction.id && "opacity-50")}>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.id}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.reservationDate}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.carModel}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.completionDate}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{formatCurrency(transaction.totalPrice)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setExpandedRow(expandedRow === transaction.id ? null : transaction.id)}
                      className="text-[#1A365D] hover:text-[#63B3ED]"
                    >
                      <Image
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector-SksAg0p4n0pZM3et1Y1lcrad0DGitc.svg"
                        alt="View details"
                        width={20}
                        height={20}
                        className={cn("transition-transform", expandedRow === transaction.id && "rotate-180")}
                      />
                    </button>
                  </td>
                </tr>
                {expandedRow === transaction.id && transaction.services && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="grid grid-cols-[25%_20%_15%_10%_10%_20%] w-full items-center">
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Service</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Mechanic</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Price</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Qty</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Disc.</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Total</div>
                        </div>
                        {transaction.services.map((service, index) => (
                          <div key={index} className="grid grid-cols-[25%_20%_15%_10%_10%_20%] w-full items-center">
                            <div className="text-sm text-[#1A365D]">{service.service}</div>
                            <div className="text-sm text-[#1A365D]">{service.mechanic}</div>
                            <div className="text-sm text-[#1A365D]">{formatCurrency(service.price)}</div>
                            <div className="text-sm text-[#1A365D]">x{service.quantity}</div>
                            <div className="text-sm text-[#EA5455]">{service.discount}%</div>
                            <div className="text-sm text-[#1A365D]">{formatCurrency(service.total)}</div>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-4 space-y-2">
                          <div className="flex justify-end">
                            <div className="grid grid-cols-[auto_20%] gap-8 text-sm ml-auto w-[40%]">
                              <div className="text-[#8B909A]">SUBTOTAL</div>
                              <div className="text-[#1A365D]">{formatCurrency(transaction.totalPrice)}</div>
                              <div className="text-[#8B909A]">DISCOUNT</div>
                              <div className="text-[#EA5455]">{formatCurrency(0)}</div>
                              <div className="text-[#8B909A]">TOTAL</div>
                              <div className="text-[#1A365D] font-semibold">
                                {formatCurrency(transaction.totalPrice)}
                              </div>
                              <div className="text-[#8B909A]">AMOUNT TENDERED</div>
                              <div className="text-[#1A365D]">{formatCurrency(transaction.totalPrice)}</div>
                              <div className="text-[#8B909A]">CHANGE</div>
                              <div className="text-[#1A365D]">{formatCurrency(0)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
<button
  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
  disabled={currentPage === 1}
  className={cn(
    "px-3 py-1 rounded-md text-sm",
    currentPage === 1 ? "text-[#8B909A] cursor-not-allowed" : "text-[#1A365D] hover:bg-[#EBF8FF]",
  )}
>
  Previous
</button>
{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
  <button
    key={page}
    onClick={() => setCurrentPage(page)}
    className={cn(
      "px-3 py-1 rounded-md text-sm",
      currentPage === page ? "bg-[#1A365D] text-white" : "text-[#1A365D] hover:bg-[#EBF8FF]",
    )}
  >
    {page}
  </button>
))}
<button
  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
  disabled={currentPage === totalPages}
  className={cn(
    "px-3 py-1 rounded-md text-sm",
    currentPage === totalPages ? "text-[#8B909A] cursor-not-allowed" : "text-[#1A365D] hover:bg-[#EBF8FF]",
  )}
>
  Next
</button>
</div>
</div>
)}
</div>
);
}

