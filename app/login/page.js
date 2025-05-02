"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion"; // Import framer-motion for animations

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("ngo");
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role }),
                credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
                document.cookie = `token=${data.token}; path=/; Secure; SameSite=Strict`;
                router.push(role === "ngo" ? "/ngo-dashboard" : "/donor-dashboard");
            } else {
                setError(data.error || "An error occurred. Please try again.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <motion.div
                initial={{ opacity: 0, y: 50 }} // Initial animation state
                animate={{ opacity: 1, y: 0 }} // Animate to this state
                transition={{ duration: 0.5 }} // Animation duration
                className="flex w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden"
            >
                {/* Left Side - Form */}
                <div className="w-1/2 p-8 flex flex-col justify-center">
                    <motion.h2
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-3xl font-bold text-gray-800 text-center mb-6"
                    >
                        Login
                    </motion.h2>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4 p-2 bg-red-100 text-red-600 text-sm rounded-md text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mb-4"
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">Login As</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 hover:border-gray-500 hover:shadow-sm font-medium text-gray-800"
                        >
                            <option value="ngo">NGO</option>
                            <option value="donor">Donor</option>
                        </select>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mb-4"
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 hover:border-gray-500 hover:shadow-sm font-medium text-gray-800"
                            required
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="mb-6"
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 hover:border-gray-500 hover:shadow-sm font-medium text-gray-800"
                            required
                        />
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        type="submit"
                        disabled={isLoading}
                        onClick={handleSubmit}
                        className="w-full bg-gray-700 text-white p-2 rounded-md font-semibold hover:bg-gray-800 transition-all duration-300"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </motion.button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="mt-4 text-center text-sm text-gray-600"
                    >
                        <p>
                            Don't have an account? {" "}
                            <a href="/register" className="text-gray-700 hover:underline">
                                Sign up
                            </a>
                        </p>
                        <p>
                            <a href="/forgot-password" className="text-gray-700 hover:underline">
                                Forgot password?
                            </a>
                        </p>
                    </motion.div>
                </div>

                {/* Right Side - Full Column Image */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-1/2 h-full mt-[15px]" // Adjusted margin-top to move the image down
                >
                    <Image
                        src="/login.webp"
                        alt="Login Illustration"
                        layout="responsive"
                        width={500}
                        height={600}
                        objectFit="cover"
                        className="rounded-r-lg" // Optional: Add rounded corners to the image
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}