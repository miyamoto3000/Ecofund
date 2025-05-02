"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/ngo-dashboard" },
  { name: "Profile", href: "/ngo-dashboard/profile" },
  { name: "Campaigns", href: "/ngo-dashboard/campaigns" },
  { name: "Donations", href: "/ngo-dashboard/donations" },
  { name: "Grants", href: "/ngo-dashboard/grants" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4">NGO Dashboard</h2>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.href} className="mb-2">
              <Link
                href={item.href}
                className={`block p-2 rounded-lg ${
                  pathname === item.href ? "bg-blue-500 text-white" : "text-gray-700"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
