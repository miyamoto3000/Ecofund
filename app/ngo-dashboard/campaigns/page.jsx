// /app/ngo-dash/page.jsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NgoDashboard() {
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch("/api/verify-token", {
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Verify-token response:", errorText, "Status:", response.status);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response Data:", data);
        if (data.ngo && Array.isArray(data.ngo.campaigns)) {
          setCampaigns(data.ngo.campaigns);
        } else {
          setCampaigns([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Error fetching campaigns: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/get-token", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to get token");
      }
      const { token } = await response.json();

      if (!token) {
        setMessage("Unauthorized: No token found");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/ngo/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ title, agenda, targetAmount, endDate }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("Campaign created successfully!");
        setCampaigns((prev) => [...prev, data.campaign]);
        setTitle("");
        setAgenda("");
        setTargetAmount("");
        setEndDate("");
      } else {
        setMessage(data.error || "Failed to create campaign");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  const handleEndCampaign = async (campaignId) => {
    try {
      console.log("Ending campaign with ID:", campaignId);
      const response = await fetch("/api/get-token", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to get token");
      }
      const { token } = await response.json();

      if (!token) {
        setMessage("Unauthorized: No token found");
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/ngo/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status: "Completed" }),
      });
      const data = await res.json();

      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((camp) =>
            camp._id === campaignId ? { ...camp, status: "Completed" } : camp
          )
        );
        setMessage("Campaign ended successfully!");
      } else {
        console.error("Failed to end campaign:", data);
        setMessage(data.error || "Failed to end campaign");
      }
    } catch (error) {
      console.error("Error ending campaign:", error);
      setMessage("Error: " + error.message);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      console.log("Deleting campaign with ID:", campaignId);
      const response = await fetch("/api/get-token", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to get token");
      }
      const { token } = await response.json();

      if (!token) {
        setMessage("Unauthorized: No token found");
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/ngo/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        setCampaigns((prev) => prev.filter((camp) => camp._id !== campaignId));
        setMessage("Campaign deleted successfully!");
      } else {
        console.error("Failed to delete campaign:", data);
        setMessage(data.error || "Failed to delete campaign");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      setMessage("Error: " + error.message);
    }
  };

  const getProgress = (raisedAmount, targetAmount) =>
    targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;

  if (loading) return <p className="text-center text-gray-600 animate-pulse">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 overflow-hidden">
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-extrabold text-indigo-900 mb-8 text-center">
          NGO Dashboard
        </h1>

        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8 mb-10"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-indigo-900 mb-6">Create New Campaign</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Campaign Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              />
            </div>
            <div>
              <textarea
                placeholder="Campaign Agenda"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 h-24"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Target Amount"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              />
            </div>
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              Create Campaign
            </button>
          </form>
          {message && <p className="mt-4 text-center text-green-600">{message}</p>}
        </motion.div>

        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-indigo-900 mb-6">Campaign History</h2>
          {campaigns.length === 0 ? (
            <p className="text-center text-gray-600">No campaigns created yet.</p>
          ) : (
            <div className="space-y-6">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-50 p-4 rounded-xl text-gray-800 hover:bg-gray-100 transition duration-200"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h3 className="font-semibold text-lg">{campaign.title}</h3>
                  <p className="text-sm text-gray-600">Agenda: {campaign.agenda}</p>
                  <p className="text-sm text-gray-500">
                    Target: ${campaign.targetAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Raised: ${campaign.raisedAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className={campaign.status === "Active" ? "text-green-600" : "text-red-600"}>{campaign.status}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Started: {new Date(campaign.startDate).toLocaleDateString()}
                  </p>
                  {campaign.endDate && (
                    <p className="text-sm text-gray-500">
                      Ends: {new Date(campaign.endDate).toLocaleDateString()}
                    </p>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${getProgress(campaign.raisedAmount, campaign.targetAmount)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Progress: {getProgress(campaign.raisedAmount, campaign.targetAmount).toFixed(2)}%
                  </p>
                  <div className="mt-4 flex space-x-2">
                    {campaign.status === "Active" && (
                      <button
                        onClick={() => handleEndCampaign(campaign._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
                      >
                        End Campaign
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCampaign(campaign._id)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
                    >
                      Delete Campaign
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

const getProgress = (raisedAmount, targetAmount) =>
  targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;