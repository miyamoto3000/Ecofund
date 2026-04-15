// /app/api/donations/verify/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Donation from "@/models/Donation";
import NGO from "@/models/NGO";

export async function POST(req) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!decoded.id || decoded.role !== "donor") {
      return NextResponse.json({ error: "Invalid token or role" }, { status: 403 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Payment verification failed — mark as failed
      await Donation.findOneAndUpdate(
        { transactionId: razorpay_order_id },
        { paymentStatus: "Failed" }
      );

      return NextResponse.json(
        { error: "Payment verification failed", verified: false },
        { status: 400 }
      );
    }

    // Payment verified — update donation record
    const donation = await Donation.findOneAndUpdate(
      { transactionId: razorpay_order_id },
      {
        paymentStatus: "Completed",
        transactionId: razorpay_payment_id, // Update to actual payment ID
      },
      { new: true }
    );

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Update NGO donation stats
    await NGO.findByIdAndUpdate(donation.ngoId, {
      $inc: { totalDonations: donation.amount, donationCount: 1 },
      $set: { lastDonationDate: new Date() },
    });

    // Update campaign raised amount if campaignId exists
    if (donation.campaignId) {
      await NGO.findOneAndUpdate(
        { _id: donation.ngoId, "campaigns._id": donation.campaignId },
        { $inc: { "campaigns.$.raisedAmount": donation.amount } }
      );
    }

    return NextResponse.json({
      message: "Payment verified successfully",
      verified: true,
      donation,
    }, { status: 200 });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment", details: error.message },
      { status: 500 }
    );
  }
}
