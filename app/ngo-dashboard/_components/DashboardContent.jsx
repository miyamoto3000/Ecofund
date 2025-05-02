"use client";
import { useEffect, useState } from "react";
import {
  FaHandHoldingHeart,
  FaUsers,
  FaChartLine,
  FaCrown,
  FaCalendarAlt,
  FaUniversity,
} from "react-icons/fa";
import { motion } from "framer-motion";

export default function DashboardContent() {
  const [ngo, setNgo] = useState(null);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branch: "",
  });
  const [upiId, setUpiId] = useState("");
  const [isEditingBank, setIsEditingBank] = useState(false);

  useEffect(() => {
    async function fetchNGO() {
      try {
        const res = await fetch("/api/ngos", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await res.json();
        console.log("Fetched NGO Data:", data);

        if (res.ok) {
          setNgo(data.ngo);
          setBankDetails({
            accountHolderName: data.ngo.bankDetails?.accountHolderName || "",
            accountNumber: data.ngo.bankDetails?.accountNumber || "",
            ifscCode: data.ngo.bankDetails?.ifscCode || "",
            bankName: data.ngo.bankDetails?.bankName || "",
            branch: data.ngo.bankDetails?.branch || "",
          });
          setUpiId(data.ngo.upiId || "");
        } else {
          throw new Error(data.error || "Failed to fetch NGO");
        }

        const donationsRes = await fetch("/api/donations/pending", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const donationsData = await donationsRes.json();
        if (donationsRes.ok) {
          setPendingDonations(donationsData.pendingDonations || []);
        } else {
          console.warn("Failed to fetch pending donations:", donationsData.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNGO();
  }, []);

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpiIdChange = (e) => {
    setUpiId(e.target.value);
  };

  const handleBankDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/ngos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bankDetails, upiId }),
      });

      const data = await res.json();
      if (res.ok) {
        setNgo(data.ngo);
        setIsEditingBank(false);
        alert("Bank details and UPI ID updated successfully!");
      } else {
        throw new Error(data.error || "Failed to update bank details and UPI ID");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVolunteerStatusChange = async (applicationId, newStatus) => {
    try {
      const res = await fetch("/api/volunteers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          applicationId,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNgo((prevNgo) => {
          const updatedApplications = prevNgo.volunteerApplications.map((app) =>
            app._id === applicationId ? { ...app, status: newStatus } : app
          );
          return { ...prevNgo, volunteerApplications: updatedApplications };
        });
        alert(`Volunteer application ${newStatus.toLowerCase()} successfully!`);
      } else {
        throw new Error(data.error || "Failed to update volunteer status");
      }
    } catch (err) {
      alert("Error updating volunteer status: " + err.message);
    }
  };

  if (loading)
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-gray-600 text-xl"
      >
        Loading NGO details...
      </motion.p>
    );
  if (error)
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-red-500 text-center text-xl"
      >
        {error}
      </motion.p>
    );
  if (!ngo)
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-gray-500 text-xl"
      >
        No NGO found
      </motion.p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-2xl rounded-2xl p-8 max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          Welcome, {ngo.name} 👋
        </h1>
        <p className="text-gray-600 text-lg">{ngo.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            {
              icon: <FaHandHoldingHeart className="text-4xl mb-2" />,
              title: "Total Donations",
              value: `₹${ngo.totalDonations?.toLocaleString() || "0"}`,
              color: "bg-blue-600",
            },
            {
              icon: <FaChartLine className="text-4xl mb-2" />,
              title: "Pending Donations",
              value: pendingDonations.length,
              color: "bg-green-600",
            },
            {
              icon: <FaUsers className="text-4xl mb-2" />,
              title: "Total Donors",
              value: ngo.donationCount || 0,
              color: "bg-purple-600",
            },
            {
              icon: <FaCrown className="text-4xl mb-2" />,
              title: "Top Donor",
              value: ngo.topDonor || "N/A",
              color: "bg-orange-600",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={`${stat.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center transform hover:-translate-y-1`}
            >
              {stat.icon}
              <p className="text-lg font-semibold">{stat.title}</p>
              <h2 className="text-3xl font-bold">{stat.value}</h2>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <FaUniversity className="mr-2 text-blue-500" /> Payment Details
          </h2>
          {isEditingBank ? (
            <form
              onSubmit={handleBankDetailsSubmit}
              className="mt-4 bg-gray-50 p-6 rounded-lg shadow-md"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700">Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={bankDetails.accountHolderName}
                    onChange={handleBankDetailsChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankDetails.accountNumber}
                    onChange={handleBankDetailsChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={bankDetails.ifscCode}
                    onChange={handleBankDetailsChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={bankDetails.bankName}
                    onChange={handleBankDetailsChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Branch</label>
                  <input
                    type="text"
                    name="branch"
                    value={bankDetails.branch}
                    onChange={handleBankDetailsChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">UPI ID</label>
                  <input
                    type="text"
                    name="upiId"
                    value={upiId}
                    onChange={handleUpiIdChange}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., ngo@upi"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 bg-gray-50 p-6 rounded-lg shadow-md">
              <p>
                <strong>Account Holder:</strong>{" "}
                {ngo.bankDetails?.accountHolderName || "N/A"}
              </p>
              <p>
                <strong>Account Number:</strong>{" "}
                {ngo.bankDetails?.accountNumber || "N/A"}
              </p>
              <p>
                <strong>IFSC Code:</strong> {ngo.bankDetails?.ifscCode || "N/A"}
              </p>
              <p>
                <strong>Bank Name:</strong> {ngo.bankDetails?.bankName || "N/A"}
              </p>
              <p>
                <strong>Branch:</strong> {ngo.bankDetails?.branch || "N/A"}
              </p>
              <p>
                <strong>UPI ID:</strong> {ngo.upiId || "N/A"}
              </p>
              <button
                onClick={() => setIsEditingBank(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit Payment Details
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-500" /> Upcoming Events
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ngo.events?.length > 0 ? (
              ngo.events.slice(0, 2).map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.2, duration: 0.4 }}
                  className="bg-gray-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-800">{event.name}</h3>
                  <p className="text-gray-600">
                    Date: {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    Goal: ₹{event.goal?.toLocaleString()}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600">No upcoming events yet.</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-semibold text-gray-800">Pending Donations</h2>
          <div className="bg-gray-50 p-6 rounded-lg mt-2 shadow-md">
            {pendingDonations.length > 0 ? (
              pendingDonations.map((donation) => (
                <div key={donation._id} className="border-b py-2">
                  <p className="text-gray-800">
                    ₹{donation.amount.toLocaleString()} - {donation.paymentMethod}{" "}
                    (Pending)
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center">No pending donations</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-semibold text-gray-800">Recent Donations</h2>
          <div className="bg-gray-50 p-6 rounded-lg mt-2 shadow-md">
            <p className="text-gray-600 text-center">Coming ...</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-semibold text-gray-800">Suggestions</h2>
          <div className="bg-gray-50 p-6 rounded-lg mt-2 shadow-md">
            {ngo.suggestions?.length > 0 ? (
              ngo.suggestions.map((suggestion, index) => (
                <div key={index} className="border-b py-2">
                  <p className="text-gray-800">
                    <strong>{suggestion.name || "Anonymous"}</strong> (
                    {suggestion.email || "No email"}): {suggestion.suggestion}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {new Date(suggestion.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center">No suggestions yet</p>
            )}
          </div>
        </motion.div>

        {/* Volunteer Applications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-semibold text-gray-800">
            Volunteer Applications
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg mt-2 shadow-md">
            {ngo.volunteerApplications?.length > 0 ? (
              ngo.volunteerApplications.map((application, index) => (
                <div key={index} className="border-b py-2">
                  <p className="text-gray-800">
                    <strong>{application.name}</strong> ({application.email})
                  </p>
                  <p className="text-gray-600">Contact: {application.contactNumber}</p>
                  <p className="text-gray-600">
                    Skills: {application.skills || "Not specified"}
                  </p>
                  <p className="text-gray-600">
                    Availability: {application.availability || "Not specified"}
                  </p>
                  <p className="text-gray-600">
                    Motivation: {application.motivation}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Applied on: {new Date(application.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    Status: <span className={
                      application.status === "Pending" ? "text-yellow-600" :
                      application.status === "Accepted" ? "text-green-600" :
                      "text-red-600"
                    }>{application.status}</span>
                  </p>
                  {application.status === "Pending" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() =>
                          handleVolunteerStatusChange(application._id, "Accepted")
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          handleVolunteerStatusChange(application._id, "Rejected")
                        }
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center">
                No volunteer applications yet
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}