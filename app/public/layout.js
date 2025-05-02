import Link from "next/link";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen">
      <header className="bg-indigo-600 text-white p-4">
        <nav>
          <Link href="/public" className="text-white mx-4 hover:underline">
            Home
          </Link>
          {/* Add more navigation links if needed */}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="bg-gray-800 text-white p-4 text-center mt-auto">
        <p>© 2025 ECOTHON. All rights reserved.</p>
      </footer>
    </div>
  );
}