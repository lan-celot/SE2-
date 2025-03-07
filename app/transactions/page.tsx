"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase'; // Ensure this path is correct
import { collection, onSnapshot } from 'firebase/firestore';
import TransactionsTable from './TransactionsTable';
import { DashboardHeader } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  reservationDate: string;
  customerName: string;
  customerId: string;
  carModel: string;
  completionDate: string;
  totalPrice: number;
  services?: {
    service: string;
    mechanic: string;
    price: number;
    quantity: number;
    discount: number;
    total: number;
  }[];
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const transactionsData: Transaction[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id, // This is the transaction ID
          reservationDate: data.reservationDate || "", // Ensure this is the correct field
          reservationId: data.reservationId || "", // Ensure this is the correct field
          customerName: data.customerName || "",
          customerId: data.customerId || "", // Ensure this is the correct field
          carModel: data.carModel || "",
          completionDate: data.completionDate || "",
          totalPrice: data.totalPrice || 0,
          services: data.services || [],
        };
      });
      setTransactions(transactionsData);
    });

    return () => unsub();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Transactions" />
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by ID, name, car model, date..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            className="bg-[#2A69AC] hover:bg-[#1A365D] text-white text-sm font-medium px-4 py-2 rounded-md"
            onClick={() => router.push("/transactions/add")}
          >
            Add Transaction
          </Button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <TransactionsTable transactions={transactions} searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  );
}
