import mongoose from "mongoose";

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactNumber: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  donations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Donation" }],
  preferredPaymentMethod: { type: String, enum: ["Bank", "UPI", "Card"] }, // Optional
}, { timestamps: true });

export default mongoose.models.Donor || mongoose.model("Donor", donorSchema);