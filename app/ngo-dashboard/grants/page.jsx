'use client'; // Enable client-side rendering for state management

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Assuming framer-motion is installed

export default function Grants() {
  const [grants, setGrants] = useState([]);
  const [filteredGrants, setFilteredGrants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGrants() {
      try {
        const response = await fetch('/api/grants');
        const data = await response.json();
        setGrants(data);
        setFilteredGrants(data); 
        setLoading(false);
      } catch (error) {
        console.error('Error fetching grants:', error);
        setLoading(false);
      }
    }

    fetchGrants();
  }, []);


  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = grants.filter((grant) => {
      const eligibilityMatch = grant.eligibility.toLowerCase().includes(term);
      const deadlineMatch = grant.deadline.toLowerCase().includes(term);
      return eligibilityMatch || deadlineMatch;
    });
    setFilteredGrants(filtered);
  };

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-white min-h-screen">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800 bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
        Available Grants
      </h1>

      {/* Search Bar */}
      <div className="mb-8 relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by eligibility or deadline..."
          className="w-full p-3 pl-10 pr-4 border border-gray-200 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-white text-gray-700 placeholder-gray-400"
        />
        <svg
          className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-4.35-4.35m0 0A7 7 0 1117 3a7 7 0 01-4.35 12.65z"
          />
        </svg>
      </div>

      {loading ? (
        <p className="text-center text-lg text-gray-600 animate-pulse">Loading grants...</p>
      ) : filteredGrants.length === 0 ? (
        <p className="text-center text-lg text-gray-600">No grants found matching your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGrants.map((grant, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h2 className="text-xl font-semibold mb-3 text-gray-900">{grant.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{grant.description}</p>
              <p className="text-gray-800 mb-2"><strong className="text-gray-700">Amount:</strong> ₹{grant.amount.toLocaleString()}</p>
              <p className="text-gray-800 mb-2"><strong className="text-gray-700">Eligibility:</strong> {grant.eligibility}</p>
              <p className="text-gray-800 mb-2"><strong className="text-gray-700">Deadline:</strong> {new Date(grant.deadline).toLocaleDateString()}</p>
              <p className="text-gray-800 mb-4">
                <strong className="text-gray-700">Source:</strong>{' '}
                <a
                  href={grant.source}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-700 underline transition-colors"
                >
                  {grant.source}
                </a>
              </p>
              <a
                href={grant.applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300 text-center"
              >
                Apply Now
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}