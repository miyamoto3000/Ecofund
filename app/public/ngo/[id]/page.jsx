"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicNGOProfile({ params }) {
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [suggestionData, setSuggestionData] = useState({ name: "", email: "", suggestion: "" });
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);
  const [suggestionSuccess, setSuggestionSuccess] = useState(false);
  const [volunteerData, setVolunteerData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    skills: "",
    availability: "",
    motivation: "",
  });
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [volunteerError, setVolunteerError] = useState(null);
  const [volunteerSuccess, setVolunteerSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNGOProfile();
  }, [params?.id]);

  const fetchNGOProfile = async () => {
    if (!params?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/public/ngo/${params.id}`, { method: "GET" });
      const data = await res.json();
      if (res.ok) {
        setNgo(data.ngo);
        setMediaPreviews(data.ngo.mediaGallery || []);
      }
    } catch (error) {
      console.error("Error fetching NGO profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonateClick = () => router.push(`/public/ngo/${params.id}/donate`);

  const handleSuggestionChange = (e) => setSuggestionData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleVolunteerChange = (e) => setVolunteerData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    setSuggestionLoading(true);
    setSuggestionError(null);
    setSuggestionSuccess(false);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ngoId: params.id, ...suggestionData }),
      });
      if (res.ok) {
        setSuggestionSuccess(true);
        setSuggestionData({ name: "", email: "", suggestion: "" });
      } else {
        setSuggestionError("Failed to submit suggestion");
      }
    } catch (err) {
      setSuggestionError("An error occurred");
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    setVolunteerLoading(true);
    setVolunteerError(null);
    setVolunteerSuccess(false);
    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ngoId: params.id, ...volunteerData }),
      });
      if (res.ok) {
        setVolunteerSuccess(true);
        setVolunteerData({ name: "", email: "", contactNumber: "", skills: "", availability: "", motivation: "" });
      } else {
        setVolunteerError("Failed to submit application");
      }
    } catch (err) {
      setVolunteerError("An error occurred");
    } finally {
      setVolunteerLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-11/12 h-96 rounded-3xl animate-pulse bg-gradient-to-r from-gray-200 to-gray-300" />
    </div>
  );
  if (!ngo) return <div className="min-h-screen flex items-center justify-center text-xl text-gray-600">NGO not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <motion.section
        className="relative h-[60vh] bg-gradient-to-br from-indigo-600 to-purple-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {ngo.coverImage ? (
            <img src={ngo.coverImage} alt="Cover" className="w-full h-full object-cover opacity-30" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
          )}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {ngo.name}
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {ngo.category}
          </motion.p>
          <motion.button
            onClick={handleDonateClick}
            className="px-8 py-3 bg-white text-indigo-600 rounded-full font-semibold hover:bg-indigo-100 transition-all"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Donate Now
          </motion.button>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About Section */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-600">
            <p className="leading-relaxed">{ngo.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong className="text-indigo-600">Mission:</strong> {ngo.mission}</div>
              <div><strong className="text-indigo-600">Vision:</strong> {ngo.vision}</div>
            </div>
          </div>
        </motion.section>

        {/* Contact Info Section */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Contact Information</h2>
          <div className="space-y-4 text-gray-600">
            <div>
              <p className="text-indigo-600 font-medium">Address:</p>
              <p>{ngo.address}, {ngo.city}, {ngo.state}, {ngo.country}</p>
            </div>
            <div>
              <p className="text-indigo-600 font-medium">Phone:</p>
              <p>{ngo.contactNumber}</p>
            </div>
            <div>
              <p className="text-indigo-600 font-medium">Social Media:</p>
              <div className="space-y-1">
                {ngo.socialMedia?.facebook && <a href={ngo.socialMedia.facebook} className="block text-indigo-600 hover:text-indigo-800">Facebook</a>}
                {ngo.socialMedia?.twitter && <a href={ngo.socialMedia.twitter} className="block text-indigo-600 hover:text-indigo-800">Twitter</a>}
                {ngo.socialMedia?.linkedin && <a href={ngo.socialMedia.linkedin} className="block text-indigo-600 hover:text-indigo-800">LinkedIn</a>}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Impact Section */}
        <motion.section
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Lives Touched", value: "beneficiariesHelped" },
              { label: "Projects", value: "projectsCompleted" },
              { label: "Volunteer Hours", value: "volunteerHours" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <p className="text-4xl font-bold text-indigo-600">{ngo.impact?.[stat.value] || 0}</p>
                <p className="text-gray-600 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ngo.team?.map((member, index) => (
              <motion.div
                key={index}
                className="bg-indigo-50 rounded-xl p-4 hover:bg-indigo-100 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <h3 className="font-semibold text-gray-800">{member.name}</h3>
                <p className="text-indigo-600">{member.role}</p>
                <p className="text-sm text-gray-600 mt-2">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Events & Updates Section */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Events</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {ngo.events?.map((event, index) => (
                <motion.div
                  key={index}
                  className="bg-purple-50 rounded-xl p-4 hover:bg-purple-100 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <h3 className="font-semibold text-gray-800">{event.title}</h3>
                  <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                  <p className="text-gray-600 mt-2">{event.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Updates</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {ngo.updates?.map((update, index) => (
                <motion.div
                  key={index}
                  className="bg-pink-50 rounded-xl p-4 hover:bg-pink-100 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <h3 className="font-semibold text-gray-800">{update.title}</h3>
                  <p className="text-sm text-gray-600">{new Date(update.date).toLocaleDateString()}</p>
                  <p className="text-gray-600 mt-2">{update.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Media Gallery */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Moments of Impact</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaPreviews.map((item, index) => renderMediaItem(item, index))}
          </div>
        </motion.section>

        {/* Registration Documents */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Credentials</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ngo.registrationDocs?.map((doc, index) => (
              <motion.div
                key={index}
                className="relative aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                onClick={() => setSelectedMedia({ item: doc, index, isDoc: true })}
              >
                <img src={doc} alt={`Document ${index}`} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Suggestions & Volunteer Section */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {/* Suggestions */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Share Your Suggestions</h2>
            {suggestionSuccess && <p className="text-green-600 mb-4">Thank you for your suggestion!</p>}
            {suggestionError && <p className="text-red-600 mb-4">{suggestionError}</p>}
            <form onSubmit={handleSuggestionSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                value={suggestionData.name}
                onChange={handleSuggestionChange}
                placeholder="Your Name (Optional)"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                name="email"
                value={suggestionData.email}
                onChange={handleSuggestionChange}
                placeholder="Your Email (Optional)"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                name="suggestion"
                value={suggestionData.suggestion}
                onChange={handleSuggestionChange}
                placeholder="Your Suggestion"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="4"
                required
              />
              <button
                type="submit"
                disabled={suggestionLoading}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {suggestionLoading ? "Submitting..." : "Submit Suggestion"}
              </button>
            </form>
          </div>

          {/* Volunteer */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Volunteer with Us</h2>
            {volunteerSuccess && <p className="text-green-600 mb-4">Application submitted successfully!</p>}
            {volunteerError && <p className="text-red-600 mb-4">{volunteerError}</p>}
            <form onSubmit={handleVolunteerSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                value={volunteerData.name}
                onChange={handleVolunteerChange}
                placeholder="Your Name"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <input
                type="email"
                name="email"
                value={volunteerData.email}
                onChange={handleVolunteerChange}
                placeholder="Your Email"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <input
                type="text"
                name="contactNumber"
                value={volunteerData.contactNumber}
                onChange={handleVolunteerChange}
                placeholder="Contact Number"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <input
                type="text"
                name="skills"
                value={volunteerData.skills}
                onChange={handleVolunteerChange}
                placeholder="Skills (Optional)"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                name="availability"
                value={volunteerData.availability}
                onChange={handleVolunteerChange}
                placeholder="Availability (Optional)"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                name="motivation"
                value={volunteerData.motivation}
                onChange={handleVolunteerChange}
                placeholder="Why volunteer with us?"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="4"
                required
              />
              <button
                type="submit"
                disabled={volunteerLoading}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {volunteerLoading ? "Submitting..." : "Apply to Volunteer"}
              </button>
            </form>
          </div>
        </motion.section>
      </div>

      {/* Media Lightbox */}
      {selectedMedia && (
        <motion.div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedMedia(null)}
        >
          <motion.div
            className="relative w-11/12 max-w-4xl p-6 bg-white rounded-3xl shadow-2xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <X size={24} />
            </button>
            {selectedMedia.isDoc ? (
              <iframe src={selectedMedia.item} className="w-full h-[80vh] rounded-2xl" title="Document" />
            ) : (
              <img src={selectedMedia.item} alt="Selected Media" className="w-full h-auto rounded-2xl" />
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );

  function renderMediaItem(item, index) {
    const isVideo = typeof item === "string" ? item.endsWith(".mp4") || item.endsWith(".webm") : item.type === "video";
    return (
      <motion.div
        key={index}
        className="relative aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all"
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 + index * 0.1 }}
        onClick={() => setSelectedMedia({ item, index })}
      >
        {isVideo ? (
          <video
            src={typeof item === "string" ? item : item.url}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
          />
        ) : (
          <img
            src={typeof item === "string" ? item : item.url}
            alt={`Media ${index}`}
            className="w-full h-full object-cover"
          />
        )}
      </motion.div>
    );
  }
}