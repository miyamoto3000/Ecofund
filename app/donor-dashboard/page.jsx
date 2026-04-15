"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DonorDashboard() {
  const [donor, setDonor] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const router = useRouter();

  // Donation modal state
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationStatus, setDonationStatus] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [donorRes, ngosRes, donationsRes, campaignsRes] = await Promise.all([
          fetch("/api/donors", { credentials: "include" }),
          fetch("/api/public/ngo", { method: "GET" }),
          fetch("/api/donations", { credentials: "include" }),
          fetch("/api/campaigns/public", { method: "GET" }),
        ]);

        const [donorData, ngosData, donationsData, campaignsData] = await Promise.all([
          donorRes.json(),
          ngosRes.json(),
          donationsRes.json(),
          campaignsRes.json(),
        ]);

        if (donorRes.ok) setDonor(donorData.donor);
        if (ngosRes.ok) setNgos(ngosData.ngos || []);
        if (donationsRes.ok) setDonations(donationsData.donations || []);
        if (campaignsRes.ok) setCampaigns(campaignsData.campaigns || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalDonated = donations
    .filter((d) => d.paymentStatus === "Completed")
    .reduce((sum, donation) => sum + (donation.amount || 0), 0);

  const filteredNgos = ngos.filter((ngo) => {
    const matchesSearch =
      ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !cityFilter || ngo.city?.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const getProgress = (raised, target) =>
    target > 0 ? Math.min((raised / target) * 100, 100) : 0;

  const handleLogout = () => {
    document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
    router.push("/login");
  };

  // Open donate modal
  const openDonateModal = (ngo, campaign = null) => {
    setSelectedNgo(ngo);
    setSelectedCampaign(campaign);
    setDonationAmount("");
    setDonationMessage("");
    setPaymentMethod("Razorpay");
    setDonationStatus(null);
    setShowDonateModal(true);
  };

  // Handle Razorpay donation
  const handleDonate = async () => {
    if (!donationAmount || Number(donationAmount) <= 0) {
      setDonationStatus({ type: "error", message: "Please enter a valid amount" });
      return;
    }

    setDonationLoading(true);
    setDonationStatus(null);

    try {
      // For UPI/Bank, auto-complete since these are instant/manual transfers
      const isManualPayment = paymentMethod === "UPI" || paymentMethod === "Bank";

      // Step 1: Create order on server
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ngoId: selectedNgo._id,
          amount: Number(donationAmount),
          message: donationMessage,
          paymentMethod,
          campaignId: selectedCampaign?._id || null,
          autoComplete: isManualPayment, // Auto-complete UPI/Bank payments
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create donation order");
      }

      if (paymentMethod === "Razorpay") {
        // Step 2: Open Razorpay checkout
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "Ecofund",
          description: `Donation to ${selectedNgo.name}${selectedCampaign ? ` - ${selectedCampaign.title}` : ""}`,
          order_id: data.orderId,
          handler: async function (response) {
            // Step 3: Verify payment on server
            try {
              const verifyRes = await fetch("/api/donations/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.verified) {
                setDonationStatus({
                  type: "success",
                  message: "🎉 Payment successful! Thank you for your donation!",
                });
                // Refresh donations list
                const donationsRes = await fetch("/api/donations", { credentials: "include" });
                const donationsData = await donationsRes.json();
                if (donationsRes.ok) setDonations(donationsData.donations || []);
                // Refresh campaigns
                const campaignsRes = await fetch("/api/campaigns/public");
                const campaignsData = await campaignsRes.json();
                if (campaignsRes.ok) setCampaigns(campaignsData.campaigns || []);
              } else {
                setDonationStatus({
                  type: "error",
                  message: verifyData.error || "Payment verification failed",
                });
              }
            } catch (err) {
              setDonationStatus({
                type: "error",
                message: "Payment verification error: " + err.message,
              });
            }
            setDonationLoading(false);
          },
          modal: {
            ondismiss: function () {
              setDonationLoading(false);
              setDonationStatus({ type: "info", message: "Payment cancelled" });
            },
          },
          prefill: {
            name: donor?.name || "",
            email: donor?.email || "",
            contact: donor?.contactNumber || "",
          },
          theme: {
            color: "#4f46e5",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          setDonationLoading(false);
          setDonationStatus({
            type: "error",
            message: `Payment failed: ${response.error.description}`,
          });
        });
        rzp.open();
      } else {
        // UPI / Bank Transfer — auto-completed
        setDonationStatus({
          type: "success",
          message: "🎉 Payment recorded successfully! Thank you for your donation!",
        });
        setDonationLoading(false);
        // Refresh donations and campaigns
        const donationsRes = await fetch("/api/donations", { credentials: "include" });
        const donationsData = await donationsRes.json();
        if (donationsRes.ok) setDonations(donationsData.donations || []);
        const campaignsRes = await fetch("/api/campaigns/public");
        const campaignsData = await campaignsRes.json();
        if (campaignsRes.ok) setCampaigns(campaignsData.campaigns || []);
      }
    } catch (err) {
      setDonationLoading(false);
      setDonationStatus({ type: "error", message: err.message });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600 animate-pulse">Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  if (!donor)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600">No Donor found</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                Ecofund
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#profile" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Profile
              </a>
              <a href="#donations" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Donations
              </a>
              <a href="#campaigns" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Campaigns
              </a>
              <a href="#ngos" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Explore NGOs
              </a>
              <div className="relative group">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-semibold cursor-pointer">
                  {donor.name.charAt(0)}
                </div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl hidden group-hover:block">
                  <div className="py-2">
                    <p className="px-4 py-2 text-gray-700">{donor.name}</p>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white"
          >
            <h1 className="text-3xl font-bold mb-2">Welcome, {donor.name}!</h1>
            <p className="text-lg">Your Impact: ₹{totalDonated.toLocaleString()}</p>
          </motion.div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile and Donations */}
            <div className="lg:col-span-1 space-y-8">
              {/* Profile Card */}
              <motion.div
                id="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-md p-6"
              >
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    {donor.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{donor.name}</h2>
                    <p className="text-gray-600">{donor.email}</p>
                  </div>
                </div>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-medium">Location:</span> {donor.city}, {donor.state},{" "}
                    {donor.country}
                  </p>
                  <p>
                    <span className="font-medium">Contact:</span>{" "}
                    {donor.contactNumber || "N/A"}
                  </p>
                </div>
              </motion.div>

              {/* Donations Card */}
              <motion.div
                id="donations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Donations</h2>
                {donations.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {donations.map((donation, index) => (
                      <div key={index} className="border-b pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">
                              ₹{donation.amount} to {donation.ngoId?.name || "Unknown NGO"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(donation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              donation.paymentStatus === "Completed"
                                ? "bg-green-100 text-green-700"
                                : donation.paymentStatus === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {donation.paymentStatus}
                          </span>
                        </div>
                        {donation.message && (
                          <p className="text-sm text-gray-500 italic">{donation.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No donations yet</p>
                )}
              </motion.div>
            </div>

            {/* Right Column - Campaigns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Campaigns Card */}
              <motion.div
                id="campaigns"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Campaigns</h2>
                {campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => {
                      const progress = getProgress(
                        campaign.raisedAmount || 0,
                        campaign.targetAmount || 0
                      );
                      return (
                        <div
                          key={campaign._id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-gray-50 to-white"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-indigo-600">{campaign.title}</h3>
                              <p className="text-sm text-gray-500">{campaign.ngoName}</p>
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              {campaign.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{campaign.agenda}</p>

                          {/* Progress Bar */}
                          <div className="mb-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>₹{(campaign.raisedAmount || 0).toLocaleString()} raised</span>
                              <span>₹{(campaign.targetAmount || 0).toLocaleString()} goal</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-3 rounded-full ${
                                  progress >= 100
                                    ? "bg-gradient-to-r from-green-400 to-green-600"
                                    : progress >= 50
                                    ? "bg-gradient-to-r from-indigo-400 to-indigo-600"
                                    : "bg-gradient-to-r from-blue-400 to-indigo-500"
                                }`}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              {progress.toFixed(1)}% funded
                            </p>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500">
                              {campaign.endDate
                                ? `Ends: ${new Date(campaign.endDate).toLocaleDateString()}`
                                : "No end date"}
                            </p>
                            <button
                              onClick={() => {
                                const ngo = ngos.find(
                                  (n) => n._id === campaign.ngoId
                                );
                                if (ngo) openDonateModal(ngo, campaign);
                              }}
                              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              Donate Now
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600">No active campaigns</p>
                )}
              </motion.div>
            </div>
          </div>

          {/* Enhanced NGO Exploration Section */}
          <motion.div
            id="ngos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Explore NGOs</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search NGOs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 pr-10 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full sm:w-48 p-4 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            {filteredNgos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNgos.map((ngo) => (
                  <motion.div
                    key={ngo._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <img
                      src={ngo.coverImage || "/placeholder-image.jpg"}
                      alt={ngo.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{ngo.name}</h3>
                      <p className="text-indigo-600 font-medium mb-2">{ngo.category}</p>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">{ngo.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">City: {ngo.city || "N/A"}</span>
                        <div className="space-x-2">
                          <Link
                            href={`/public/ngo/${ngo._id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openDonateModal(ngo)}
                            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm"
                          >
                            Donate
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 text-lg py-12">
                No NGOs found matching your criteria
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Donation Modal */}
      <AnimatePresence>
        {showDonateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!donationLoading) setShowDonateModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Donate to {selectedNgo?.name}
              </h2>
              {selectedCampaign && (
                <p className="text-indigo-600 text-sm mb-4">
                  Campaign: {selectedCampaign.title}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    placeholder="Leave a message..."
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                  >
                    <option value="Razorpay">Razorpay (Card / UPI / NetBanking)</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>

                {donationStatus && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      donationStatus.type === "success"
                        ? "bg-green-100 text-green-700"
                        : donationStatus.type === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {donationStatus.message}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleDonate}
                    disabled={donationLoading}
                    className="flex-1 bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {donationLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Donate ₹${donationAmount || "0"}`
                    )}
                  </button>
                  <button
                    onClick={() => setShowDonateModal(false)}
                    disabled={donationLoading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}