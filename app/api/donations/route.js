import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Donation from "@/models/Donation";
import Donor from "@/models/Donar";
import NGO from "@/models/NGO";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
    const { ngoId, amount, message, paymentMethod, campaignId, autoComplete = false } = body;

    if (!ngoId || !amount || amount <= 0 || !paymentMethod) {
      return NextResponse.json(
        { error: "Invalid donation data", details: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    // Razorpay payment flow
    if (paymentMethod === "Razorpay") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay credentials missing");
        return NextResponse.json(
          { error: "Server configuration error", details: "Razorpay credentials missing" },
          { status: 500 }
        );
      }

      // Create Razorpay order
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          ngoId: ngoId,
          donorId: decoded.id,
          campaignId: campaignId || "",
        },
      };

      const order = await razorpay.orders.create(options);

      // Create pending donation record
      const donation = await Donation.create({
        donorId: decoded.id,
        ngoId,
        campaignId: campaignId || null,
        amount,
        message,
        paymentMethod: "Razorpay",
        paymentStatus: "Pending",
        transactionId: order.id, // Razorpay order ID
      });

      await Donor.findByIdAndUpdate(decoded.id, {
        $push: { donations: donation._id },
      });

      return NextResponse.json({
        message: "Razorpay order created",
        donation,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      }, { status: 201 });

    } else if (paymentMethod === "UPI" || paymentMethod === "Bank Transfer" || paymentMethod === "Bank") {
      // UPI / Bank Transfer flow (unchanged)
      const donation = await Donation.create({
        donorId: decoded.id,
        ngoId,
        campaignId: campaignId || null,
        amount,
        message,
        paymentMethod,
        paymentStatus: autoComplete ? "Completed" : "Pending",
      });

      await Donor.findByIdAndUpdate(decoded.id, {
        $push: { donations: donation._id },
      });

      if (autoComplete) {
        await NGO.findByIdAndUpdate(ngoId, {
          $inc: { totalDonations: amount, donationCount: 1 },
          $set: { lastDonationDate: new Date() },
        });

        // Update campaign raised amount if campaignId is provided
        if (campaignId) {
          await NGO.findOneAndUpdate(
            { _id: ngoId, "campaigns._id": campaignId },
            { $inc: { "campaigns.$.raisedAmount": amount } }
          );
        }
      }

      return NextResponse.json({
        message: autoComplete
          ? `${paymentMethod} donation recorded as successful`
          : `${paymentMethod} donation initiated. Please complete the payment manually.`,
        donation,
      }, { status: 201 });

    } else {
      return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST /api/donations:", error);
    return NextResponse.json(
      { error: "Failed to process donation", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No Token Found" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id || decoded.role !== "donor") {
      return NextResponse.json({ error: "Invalid token or role" }, { status: 400 });
    }

    const donations = await Donation.find({ donorId: decoded.id }).populate("ngoId", "name");
    return NextResponse.json({ donations }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch donations", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
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

    // Allow NGOs to verify donations too (not just admin)
    if (decoded.role !== "admin" && decoded.role !== "ngo") {
      return NextResponse.json({ error: "Forbidden: Admin or NGO access required" }, { status: 403 });
    }

    const body = await req.json();
    const { donationId, paymentStatus } = body;

    if (!donationId || !["Completed", "Failed"].includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Invalid request", details: "Missing donationId or invalid paymentStatus" },
        { status: 400 }
      );
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (donation.paymentStatus !== "Pending") {
      return NextResponse.json({ error: "Donation already processed" }, { status: 400 });
    }

    donation.paymentStatus = paymentStatus;
    await donation.save();

    if (paymentStatus === "Completed") {
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
    }

    return NextResponse.json({
      message: `Donation status updated to ${paymentStatus}`,
      donation,
    }, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH /api/donations:", error);
    return NextResponse.json(
      { error: "Failed to update donation status", details: error.message },
      { status: 500 }
    );
  }
}