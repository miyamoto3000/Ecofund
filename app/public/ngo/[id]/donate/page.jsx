"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "qrcode";

export default function DonatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [ngo, setNgo] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [paymentType, setPaymentType] = useState("PayPal");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [autoComplete, setAutoComplete] = useState(false);

  useEffect(() => {
    async function fetchNgo() {
      try {
        console.log("Fetching NGO with ID:", id);
        const res = await fetch(`/api/public/ngo/${id}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        console.log("NGO fetch response:", JSON.stringify(data, null, 2)); // Detailed response log
        if (res.ok) {
          setNgo(data.ngo);
          console.log("NGO data set:", JSON.stringify(data.ngo, null, 2)); // Detailed NGO data log
        } else {
          setError(data.error || "Failed to fetch NGO details");
        }
      } catch (err) {
        console.error("Error fetching NGO:", err);
        setError(err.message || "Network error while fetching NGO");
      } finally {
        setLoading(false);
      }
    }
    fetchNgo();
  }, [id]);

  useEffect(() => {
    if (paymentType === "Manual" && paymentMethod === "UPI" && ngo?.upiId && amount) {
      const upiUrl = `upi://pay?pa=${ngo.upiId}&pn=${encodeURIComponent(ngo.name)}&am=${amount}&cu=INR`;
      QRCode.toDataURL(upiUrl, { width: 200 }, (err, url) => {
        if (err) {
          console.error("QR Code generation error:", err);
          setError("Failed to generate UPI QR code");
        } else {
          setQrCodeUrl(url);
          console.log("QR Code URL generated:", url);
        }
      });
    } else {
      setQrCodeUrl("");
      console.log("QR code not generated: ", { paymentType, paymentMethod, upiId: ngo?.upiId, amount });
    }
  }, [paymentType, paymentMethod, ngo, amount]);

  const handlePaypalDonate = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ngoId: id,
          amount: parseInt(amount),
          message,
          paymentMethod: "PayPal",
        }),
      });

      const data = await res.json();
      if (res.ok && data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        setError(data.error || data.details || "Failed to initiate PayPal donation");
      }
    } catch (err) {
      setError(err.message || "Network error occurred during PayPal donation");
    } finally {
      setLoading(false);
    }
  };

  const handleManualDonate = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }
  
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent
      body: JSON.stringify({
        ngoId: id,
        amount: parseInt(amount),
        message,
        paymentMethod,
        autoComplete,
      }),
    });
  
      const data = await res.json();
      console.log("Donation response:", data); // Debug: Log API response
      if (res.ok) {
        const msg = autoComplete
          ? "Donation recorded as successful."
          : "Please complete the payment using the provided details.";
        alert(msg);
        router.push(`/donate/success?donationId=${data.donation._id}`);
      } else {
        setError(data.error || data.details || "Failed to initiate manual donation");
      }
    } catch (err) {
      setError(err.message || "Network error occurred during manual donation");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10"><p className="text-gray-600 animate-pulse text-lg">Loading...</p></div>;
  }

  if (error && !ngo) {
    return <div className="text-center py-10"><p className="text-red-600 text-lg">{error}</p></div>;
  }

  if (!ngo) {
    return <div className="text-center py-10"><p className="text-gray-600 text-lg">NGO not found</p></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg mt-8"
    >
      <h1 className="text-2xl font-bold text-indigo-900 mb-6 text-center">Donate to {ngo.name}</h1>
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Payment Type</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            disabled={loading}
          >
            <option value="PayPal">PayPal Sandbox</option>
            <option value="Manual">Manual (Local Payments)</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter donation amount"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            required
            min="1"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Message (Optional)</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            disabled={loading}
          />
        </div>

        {paymentType === "Manual" && (
          <>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Manual Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                disabled={loading}
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {paymentMethod === "UPI" && (
              <div className="text-center">
                {ngo.upiId ? (
                  <>
                    <p className="text-gray-700 mb-2">Scan the QR code or use: {ngo.upiId}</p>
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="UPI QR Code" className="mx-auto w-48 h-48" />
                    ) : (
                      amount ? (
                        <p className="text-gray-500">Generating QR code...</p>
                      ) : (
                        <p className="text-gray-500">Enter amount to see QR code</p>
                      )
                    )}
                  </>
                ) : (
                  <p className="text-red-600">UPI ID not available for this NGO</p>
                )}
              </div>
            )}

            {paymentMethod === "Bank Transfer" && (
              <div className="text-gray-700 space-y-2">
                {ngo.bankDetails && Object.keys(ngo.bankDetails).length > 0 ? (
                  <>
                    <p>
                      <strong>Account Holder:</strong>{" "}
                      {ngo.bankDetails.accountHolderName || "Not provided"}
                    </p>
                    <p>
                      <strong>Account Number:</strong>{" "}
                      {ngo.bankDetails.accountNumber || "Not provided"}
                    </p>
                    <p>
                      <strong>IFSC Code:</strong> {ngo.bankDetails.ifscCode || "Not provided"}
                    </p>
                    <p>
                      <strong>Bank Name:</strong> {ngo.bankDetails.bankName || "Not provided"}
                    </p>
                    <p>
                      <strong>Branch:</strong> {ngo.bankDetails.branch || "Not provided"}
                    </p>
                  </>
                ) : (
                  <p className="text-red-600">Bank details not available for this NGO</p>
                )}
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={autoComplete}
                onChange={(e) => setAutoComplete(e.target.checked)}
                className="mr-2"
                disabled={loading}
              />
              <label className="text-gray-700 text-sm">
                Mark as completed immediately (for testing)
              </label>
            </div>
          </>
        )}

        {error && <p className="text-red-600 text-sm bg-red-100 p-2 rounded">{error}</p>}

        <button
          onClick={paymentType === "PayPal" ? handlePaypalDonate : handleManualDonate}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-medium ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          } transition-colors`}
        >
          {loading
            ? "Processing..."
            : `Donate Now (${paymentType === "PayPal" ? "PayPal Sandbox" : paymentMethod})`}
        </button>

        {paymentType === "PayPal" && (
          <p className="text-gray-500 text-sm text-center mt-4">
            Using PayPal Sandbox. Log in with your sandbox buyer account.
          </p>
        )}
      </div>
    </motion.div>
  );
}