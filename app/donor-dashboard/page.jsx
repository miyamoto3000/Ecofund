"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DonorDashboard() {
  const [donor, setDonor] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");

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

  const totalDonated = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
  const filteredNgos = ngos.filter((ngo) => {
    const matchesSearch =
      ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !cityFilter || (ngo.city?.toLowerCase() === cityFilter.toLowerCase());
    return matchesSearch && matchesCity;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-xl text-gray-600 animate-pulse">Loading...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-xl text-red-600">{error}</p></div>;
  if (!donor) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-xl text-gray-600">No Donor found</p></div>;

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
                    <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    <Link href="/logout" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Logout
                    </Link>
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
            <p className="text-lg">Your Impact: Rs {totalDonated.toLocaleString()}</p>
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
                  <p><span className="font-medium">Location:</span> {donor.city}, {donor.state}, {donor.country}</p>
                  <p><span className="font-medium">Contact:</span> {donor.contactNumber || "N/A"}</p>
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
                        <p className="font-medium">Rs {donation.amount} to {donation.ngoId?.name || "Unknown NGO"}</p>
                        <p className="text-sm text-gray-600">{new Date(donation.createdAt).toLocaleDateString()}</p>
                        {donation.message && <p className="text-sm text-gray-500 italic">{donation.message}</p>}
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
                    {campaigns.map((campaign) => (
                      <div key={campaign._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-gray-50 to-white">
                        <h3 className="font-medium text-indigo-600">{campaign.title}</h3>
                        <p className="text-gray-600">{campaign.agenda}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Raised: Rs {campaign.raisedAmount.toLocaleString()} / Rs {campaign.targetAmount.toLocaleString()}</p>
                          <p>Ends: {new Date(campaign.endDate).toLocaleDateString()}</p>
                        </div>
                        <Link
                          href={`/public/ngo/${campaign.ngoId}/donate?campaign=${campaign._id}`}
                          className="mt-2 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Donate Now
                        </Link>
                      </div>
                    ))}
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
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                          <Link
                            href={`/public/ngo/${ngo._id}/donate`}
                            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                          >
                            Donate
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 text-lg py-12">No NGOs found matching your criteria</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}