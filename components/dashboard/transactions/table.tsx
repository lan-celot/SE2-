"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct
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
  userId: string; // Add userId to the props to identify the user
}

export function TransactionsTable({ searchQuery, userId }: TransactionsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!userId) {
      console.error("userId is undefined or empty. Please ensure userId is correctly passed to the component.");
      return;
    }

    const unsub = onSnapshot(collection(db, 'users', userId, 'transactions'), (snapshot) => {
      if (snapshot.empty) {
        console.warn("No transactions found for the given userId.");
        setTransactionsData([]);
        return;
      }

      const transactions: Transaction[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          reservationDate: data.reservationDate || "",
          carModel: data.carModel || "",
          completionDate: data.completionDate || "",
          totalPrice: data.totalPrice || 0,
          services: data.services || [],
        };
      });
      setTransactionsData(transactions);
    });

    return () => unsub();
  }, [userId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const formatCurrency = (amount: number) => {
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
        return new Date(aValue).getTime() - new Date(bValue).getTime();
      }
      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0;
    });

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const currentItems = filteredAndSortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {[
                { key: "id", label: "RESERVATION ID" },
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
    </div>
  );
}
