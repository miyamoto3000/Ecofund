"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [ngo, setNgo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchNGO() {
      const res = await fetch("/api/ngos", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setNgo(data.ngo);
    }
    fetchNGO();
  }, []);

  const handleLogout = async () => {
    // Clear the token cookie by setting it to expire immediately
    document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between bg-white p-4 shadow">
      <h1 className="text-xl font-semibold">
        {ngo ? `Welcome, ${ngo.name}` : "Loading NGO..."}
      </h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
    </nav>
  );
}
