"use client";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

export default function DonationSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const donationId = searchParams.get("donationId");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full text-center"
      >
        <h1 className="text-3xl font-bold text-indigo-900 mb-4">Thank You!</h1>
        <p className="text-gray-600 mb-6">
          Your donation has been successfully processed. Donation ID: {donationId || "N/A"}.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-all duration-300"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}