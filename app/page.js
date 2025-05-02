"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Globe, Users } from "lucide-react"; // Icons for visual appeal

export default function Home() {
  // Animation variants for reusability
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const buttonVariants = {
    hover: { scale: 1.1, transition: { type: "spring", stiffness: 300 } },
  };

  const cardVariants = {
    hover: { scale: 1.05, rotate: 1, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Hero Section */}
      <motion.section
        className="flex flex-col items-center justify-center min-h-screen px-6 py-16 text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1
          className="text-5xl md:text-7xl font-extrabold text-indigo-900 tracking-tight leading-tight"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Empower Change, <span className="text-purple-600">One Step at a Time</span>
        </motion.h1>
        <motion.p
          className="mt-4 text-lg md:text-2xl text-gray-700 max-w-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Connecting donors and NGOs to create a world where every act of kindness counts.
        </motion.p>
        <motion.div
          className="mt-8 flex gap-6 justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.div variants={buttonVariants} whileHover="hover">
            <Link
              href="/register"
              className="px-8 py-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2 text-lg font-semibold"
            >
              I'm a Donor <ArrowRight size={20} />
            </Link>
          </motion.div>
          <motion.div variants={buttonVariants} whileHover="hover">
            <Link
              href="/register"
              className="px-8 py-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 flex items-center gap-2 text-lg font-semibold"
            >
              I'm an NGO <ArrowRight size={20} />
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Our Goal Section */}
      <motion.section
        className="py-16 px-6 bg-white/90 backdrop-blur-xl rounded-3xl mx-4 md:mx-8 lg:mx-16 shadow-xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 text-center mb-8">
          Our Goal
        </h2>
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            className="text-lg md:text-xl text-gray-700 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            To bridge the gap between generous donors and impactful NGOs, fostering a global
            community where every donation fuels positive change—be it education, sustainability,
            or basic needs.
          </motion.p>
          <motion.div
            className="mt-8 flex justify-center gap-8 flex-wrap"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <Heart size={24} />
              <span className="font-semibold">Empower Communities</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Globe size={24} />
              <span className="font-semibold">Global Impact</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Users size={24} />
              <span className="font-semibold">Unite for Change</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured NGOs */}
      <motion.section
        className="py-16 px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 text-center mb-8">
          Featured NGOs
        </h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Helping Hands",
              desc: "Providing education to underprivileged children.",
              img: "/helping hands.jpg",
            },
            {
              name: "Green Earth",
              desc: "Working towards environmental sustainability.",
              img: "/green.jpg",
            },
            {
              name: "Food for All",
              desc: "Fighting hunger with meals for the needy.",
              img: "/food.jpg",
            },
          ].map((ngo, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
              variants={cardVariants}
              whileHover="hover"
            >
              <img
                src={ngo.img}
                alt={ngo.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-indigo-900">{ngo.name}</h3>
                <p className="mt-2 text-gray-600 text-sm">{ngo.desc}</p>
                <Link
                  href="/ngos"
                  className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-300"
                >
                  Learn More <ArrowRight size={16} className="inline ml-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="py-8 text-center text-gray-600 text-sm bg-white/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        © {new Date().getFullYear()} NGO Crowdfunding Platform. All rights reserved.
      </motion.footer>
    </div>
  );
}