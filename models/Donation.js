// /models/Donation.js
import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "NGO", required: true },
  campaignId: { type: String, default: null }, // Optional: subdocument ID of the campaign
  amount: { type: Number, required: true },
  message: { type: String },
  paymentMethod: {
    type: String,
    enum: ["Bank", "UPI", "Card", "Razorpay", "PayPal"], // Keep PayPal for legacy records
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  transactionId: { type: String }, // Razorpay order_id or payment_id
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Donation || mongoose.model("Donation", donationSchema);