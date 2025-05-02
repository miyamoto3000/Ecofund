"use client";

import Navbar from "@/app/ngo-dashboard/_components/Navbar";
import Sidebar from "@/app/ngo-dashboard/_components/Sidebar"; 
import DashboardContent from "@/app/ngo-dashboard/_components/DashboardContent";



export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="p-6">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}
