"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ngo", // Default to NGO
    description: "",
    category: "",
    vision: "",
    mission: "",
    contactNumber: "",
    address: "",
    city: "",
    state: "",
    country: "",
    website: "",
    goalAmount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("User registered successfully!");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <motion.h2
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-bold text-gray-800 text-center mb-6"
          >
            Register
          </motion.h2>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-600 text-sm rounded-md text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-2 bg-green-100 text-green-600 text-sm rounded-md text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
            >
              <option value="ngo">Register as NGO</option>
              <option value="donor">Register as Donor</option>
            </select>
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
            />

            {/* NGO-Specific Fields */}
            {formData.role === "ngo" && (
              <>
                <textarea
                  name="description"
                  placeholder="Description"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                ></textarea>
                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <textarea
                  name="vision"
                  placeholder="Vision"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                ></textarea>
                <textarea
                  name="mission"
                  placeholder="Mission"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                ></textarea>
                <input
                  type="text"
                  name="contactNumber"
                  placeholder="Contact Number"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="url"
                  name="website"
                  placeholder="Website (Optional)"
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="number"
                  name="goalAmount"
                  placeholder="Goal Amount (₹)"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
              </>
            )}

            {/* Donor-Specific Fields */}
            {formData.role === "donor" && (
              <>
                <input
                  type="text"
                  name="contactNumber"
                  placeholder="Contact Number"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  required
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md font-medium text-gray-700 mb-1"
                />
              </>
            )}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gray-700 text-white p-2 rounded-md font-semibold hover:bg-gray-800 transition-all duration-300"
            >
              {loading ? "Registering..." : "Register"}
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-4 text-center text-sm text-gray-600"
          >
            <p>
              Already have an account?{" "}
              <a href="/login" className="text-gray-700 hover:underline">
                Login
              </a>
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-1/2 h-full"
        >
          <Image
            src="/login.webp"
            alt="Register Illustration"
            layout="responsive"
            width={500}
            height={600}
            objectFit="cover"
            className="rounded-r-lg"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}