"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [ngo, setNgo] = useState(null);

  useEffect(() => {
    async function fetchNGO() {
      const res = await fetch("/api/ngos");
      const data = await res.json();
      if (res.ok) setNgo(data.ngo);
    }
    fetchNGO();
  }, []);

  return (
    <nav className="flex items-center justify-between bg-white p-4 shadow">
      <h1 className="text-xl font-semibold">
        {ngo ? `Welcome, ${ngo.name}` : "Loading NGO..."}
      </h1>
      <button className="bg-red-500 text-white px-4 py-2 rounded-lg">
        Logout
      </button>
    </nav>
  );
} 

