// /models/Donation.js
import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "NGO", required: true },
  amount: { type: Number, required: true },
  message: { type: String },
  paymentMethod: {
    type: String,
    enum: ["Bank", "UPI", "Card", "PayPal"], // Updated to include "PayPal"
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Donation || mongoose.model("Donation", donationSchema);