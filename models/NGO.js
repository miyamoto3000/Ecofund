import mongoose from "mongoose";

const ngoSchema = new mongoose.Schema(
  {
    // Existing fields...
    name: { type: String, required: true },
    campaigns: [  
      {
        title: { type: String, required: true },
        agenda: { type: String, required: true }, // Campaign description or purpose
        targetAmount: { type: Number, required: true }, // Target money to raise
        raisedAmount: { type: Number, default: 0 }, // Amount raised so far
        status: {
          type: String,
          enum: ["Active", "Completed", "Cancelled"],
          default: "Active",
        },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date }, // Optional end date for the campaign
      },
    ], 
    suggestions: [
      {
        donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor" }, // Optional, if user is logged in
        name: { type: String }, // Name of the person giving the suggestion
        email: { type: String }, // Email of the person giving the suggestion
        suggestion: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ], 
    volunteerApplications: [
      {
        donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor" }, // Optional, if user is logged in
        name: { type: String, required: true },
        email: { type: String, required: true },
        contactNumber: { type: String, required: true },
        skills: { type: String },
        availability: { type: String },
        motivation: { type: String, required: true },
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Rejected"],
          default: "Pending",
        },
        date: { type: Date, default: Date.now },
      },
    ],
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    description: { type: String, required: true },
    mission: { type: String, required: true },
    vision: { type: String, required: true },
    category: { type: String, required: true },
    contactNumber: {
      type: String,
      required: true,
      match: [/^\+?[0-9]{7,15}$/, "Invalid phone number format"],
    },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    website: { type: String },
    profileImage: { type: String },
    coverImage: { type: String },
    mediaGallery: [{ type: String }],
    registrationDocs: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    verificationDocuments: [{ type: String }],
    govtApprovalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    socialMedia: {
      facebook: { type: String },
      twitter: { type: String },
      linkedin: { type: String },
      instagram: { type: String },
    },
    impact: {
      beneficiariesHelped: { type: Number, default: 0 },
      projectsCompleted: { type: Number, default: 0 },
      volunteerHours: { type: Number, default: 0 },
    },
    team: [
      {
        name: { type: String },
        role: { type: String },
        image: { type: String },
        bio: { type: String },
      },
    ],
    events: [
      {
        title: { type: String },
        date: { type: Date },
        description: { type: String },
        raisedAmount: { type: Number, default: 0 },
      },
    ],
    updates: [
      {
        title: { type: String },
        content: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    // Existing Payment Details
    bankDetails: {
      accountHolderName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
      branch: { type: String },
    },
    upiId: { type: String }, // e.g., "ngo@upi"

    // Razorpay-specific fields
    razorpayKeyId: { type: String }, // Client-side Key ID for each NGO's Razorpay account
    razorpayKeySecret: { type: String }, // Server-side Key Secret (store securely, e.g., encrypted)
    razorpayAccountStatus: { type: String, enum: ["Pending", "Active", "Suspended"], default: "Pending" }, // Track Razorpay account status
    razorpayConnectedAccountId: { type: String }, // If using sub-merchant model under your platform's account

    // Optional Donation Tracking (enhances NGO profile visibility)
    totalDonations: { type: Number, default: 0 }, // Total amount donated
    donationCount: { type: Number, default: 0 }, // Number of donations
    lastDonationDate: { type: Date }, // Date of the last donation
  },
  { timestamps: true }
);

// Custom method to exclude sensitive fields when converting to JSON
ngoSchema.methods.toJSON = function () {
  const ngo = this.toObject();
  delete ngo.password;
  delete ngo.isVerified;
  delete ngo.verificationDocuments;
  delete ngo.govtApprovalStatus;
  delete ngo.razorpayKeySecret; // Exclude Key Secret for security
  return ngo;
};

export default mongoose.models.NGO || mongoose.model("NGO", ngoSchema);