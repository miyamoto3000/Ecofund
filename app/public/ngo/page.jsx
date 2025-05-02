"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function NGOPublicList() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNGOs();
  }, []);

  const fetchNGOs = async () => {
    try {
      const res = await fetch("/api/public/ngo", { method: "GET" });
      const data = await res.json();
      if (res.ok) {
        setNgos(data.ngos);
      }
    } catch (error) {
      console.error("Error fetching NGO list:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-screen flex items-center justify-center"
      >
        <div className="w-full max-w-4xl h-96 rounded-3xl animate-pulse bg-gradient-to-r from-gray-200 to-gray-300" />
      </motion.div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-bold text-indigo-900 mb-8">Explore NGOs</h1>
        {ngos.length === 0 ? (
          <p className="text-center text-gray-600">No NGOs available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {ngos.map((ngo) => (
              <motion.div
                key={ngo._id}
                className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * ngos.indexOf(ngo) }}
              >
                <img
                  src={ngo.coverImage || "/placeholder-image.jpg"}
                  alt={ngo.name}
                  className="w-full h-48 object-cover rounded-2xl mb-4"
                />
                <h2 className="text-xl font-semibold text-indigo-900">{ngo.name}</h2>
                <p className="text-gray-600 mt-2">{ngo.category}</p>
                <p className="text-gray-500 mt-1 line-clamp-2">{ngo.description}</p>
                <Link href={`/public/ngo/${ngo._id}`} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                  View Profile
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}