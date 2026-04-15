"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "qrcode";

export default function DonatePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign");

  const [ngo, setNgo] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [paymentType, setPaymentType] = useState("Razorpay");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [donationLoading, setDonationLoading] = useState(false);
  const [autoComplete, setAutoComplete] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [donor, setDonor] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/public/ngo/${id}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setNgo(data.ngo);
        } else {
          setError(data.error || "Failed to fetch NGO details");
        }

        // Try to fetch donor info for prefill
        const donorRes = await fetch("/api/donors", { credentials: "include" });
        if (donorRes.ok) {
          const donorData = await donorRes.json();
          setDonor(donorData.donor);
        }
      } catch (err) {
        setError(err.message || "Network error while fetching NGO");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (paymentType === "Manual" && paymentMethod === "UPI" && ngo?.upiId && amount) {
      const upiUrl = `upi://pay?pa=${ngo.upiId}&pn=${encodeURIComponent(ngo.name)}&am=${amount}&cu=INR`;
      QRCode.toDataURL(upiUrl, { width: 200 }, (err, url) => {
        if (err) {
          setError("Failed to generate UPI QR code");
        } else {
          setQrCodeUrl(url);
        }
      });
    } else {
      setQrCodeUrl("");
    }
  }, [paymentType, paymentMethod, ngo, amount]);

  const handleRazorpayDonate = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setDonationLoading(true);
      setError("");
      setSuccessMessage("");

      // Step 1: Create Razorpay order
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ngoId: id,
          amount: parseInt(amount),
          message,
          paymentMethod: "Razorpay",
          campaignId: campaignId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create donation order");
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Ecofund",
        description: `Donation to ${ngo.name}`,
        order_id: data.orderId,
        handler: async function (response) {
          // Step 3: Verify payment
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
              setSuccessMessage("🎉 Payment successful! Thank you for your donation!");
            } else {
              setError(verifyData.error || "Payment verification failed");
            }
          } catch (err) {
            setError("Payment verification error: " + err.message);
          }
          setDonationLoading(false);
        },
        modal: {
          ondismiss: function () {
            setDonationLoading(false);
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
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Error processing donation");
      setDonationLoading(false);
    }
  };

  const handleManualDonate = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setDonationLoading(true);
      setError("");
      setSuccessMessage("");

      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ngoId: id,
          amount: parseInt(amount),
          message,
          paymentMethod,
          autoComplete,
          campaignId: campaignId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(
          autoComplete
            ? "Donation recorded as successful!"
            : "Donation initiated. Please complete the payment using the provided details."
        );
      } else {
        setError(data.error || "Failed to initiate donation");
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setDonationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 animate-pulse text-lg">Loading...</p>
      </div>
    );
  }

  if (error && !ngo) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 text-lg">NGO not found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg mt-8"
    >
      <h1 className="text-2xl font-bold text-indigo-900 mb-6 text-center">
        Donate to {ngo.name}
      </h1>

      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Payment Type</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            disabled={donationLoading}
          >
            <option value="Razorpay">Razorpay (Card / UPI / NetBanking)</option>
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
            disabled={donationLoading}
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
            disabled={donationLoading}
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
                disabled={donationLoading}
              >
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Transfer</option>
              </select>
            </div>

            {paymentMethod === "UPI" && (
              <div className="text-center">
                {ngo.upiId ? (
                  <>
                    <p className="text-gray-700 mb-2">
                      Scan the QR code or use: {ngo.upiId}
                    </p>
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="UPI QR Code" className="mx-auto w-48 h-48" />
                    ) : amount ? (
                      <p className="text-gray-500">Generating QR code...</p>
                    ) : (
                      <p className="text-gray-500">Enter amount to see QR code</p>
                    )}
                  </>
                ) : (
                  <p className="text-red-600">UPI ID not available for this NGO</p>
                )}
              </div>
            )}

            {paymentMethod === "Bank" && (
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
                disabled={donationLoading}
              />
              <label className="text-gray-700 text-sm">
                Mark as completed immediately (for testing)
              </label>
            </div>
          </>
        )}

        {error && <p className="text-red-600 text-sm bg-red-100 p-2 rounded">{error}</p>}
        {successMessage && (
          <p className="text-green-600 text-sm bg-green-100 p-2 rounded">{successMessage}</p>
        )}

        <button
          onClick={paymentType === "Razorpay" ? handleRazorpayDonate : handleManualDonate}
          disabled={donationLoading}
          className={`w-full py-2 rounded-lg text-white font-medium ${
            donationLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          } transition-colors`}
        >
          {donationLoading
            ? "Processing..."
            : `Donate ₹${amount || "0"} (${paymentType === "Razorpay" ? "Razorpay" : paymentMethod})`}
        </button>

        {paymentType === "Razorpay" && (
          <p className="text-gray-500 text-sm text-center mt-4">
            Razorpay Test Mode — Use test card: 4111 1111 1111 1111
          </p>
        )}
      </div>
    </motion.div>
  );
}