import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Donation from "@/models/Donation";
import Donor from "@/models/Donar";
import NGO from "@/models/NGO";
const paypal = require('@paypal/checkout-server-sdk');

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET,
  { timeout: 60000 }
);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

async function executePaypalRequest(request, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await paypalClient.execute(request);
      return response;
    } catch (error) {
      if (attempt === retries || !error.message.includes('timeout')) {
        console.error(`PayPal request failed on attempt ${attempt}: ${error.message}`);
        throw new Error(`PayPal request failed: ${error.message}`);
      }
      console.warn(`Attempt ${attempt} failed, retrying... (${retries - attempt} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

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
    const { ngoId, amount, message, paymentMethod, autoComplete = false } = body;

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

    // Create donation record based on payment method
    if (paymentMethod === "PayPal") {
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        console.error("PayPal credentials missing");
        return NextResponse.json(
          { error: "Server configuration error", details: "PayPal credentials missing" },
          { status: 500 }
        );
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "INR",
            value: amount.toString(),
          },
          description: `Donation to NGO ${ngoId}`,
        }],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/donations/capture`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/ngo/${ngoId}/donate`,
        },
      });

      const order = await executePaypalRequest(request);

      const donation = await Donation.create({
        donorId: decoded.id,
        ngoId,
        amount,
        message,
        paymentMethod,
        paymentStatus: "Pending",
        transactionId: order.result.id,
      });

      await Donor.findByIdAndUpdate(decoded.id, {
        $push: { donations: donation._id },
      });

      const approvalUrl = order.result.links.find(link => link.rel === "approve").href;
      return NextResponse.json({
        message: "PayPal payment initiated",
        donation,
        approvalUrl,
      }, { status: 201 });
    } else if (paymentMethod === "UPI" || paymentMethod === "Bank Transfer") {
      const donation = await Donation.create({
        donorId: decoded.id,
        ngoId,
        amount,
        message,
        paymentMethod,
        paymentStatus: autoComplete ? "Completed" : "Pending", // Default to "Pending" unless autoComplete is true
      });

      await Donor.findByIdAndUpdate(decoded.id, {
        $push: { donations: donation._id },
      });

      if (autoComplete) {
        // Update NGO stats if donation is marked as completed
        await NGO.findByIdAndUpdate(ngoId, {
          $inc: { totalDonations: amount, donationCount: 1 },
          $set: { lastDonationDate: new Date() },
        });
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
  const url = new URL(req.url);
  if (url.pathname.endsWith("/capture")) {
    try {
      const token = url.searchParams.get("token");
      if (!token) {
        return NextResponse.json({ error: "No payment token provided" }, { status: 400 });
      }

      const request = new paypal.orders.OrdersCaptureRequest(token);
      const capture = await executePaypalRequest(request);

      const donation = await Donation.findOneAndUpdate(
        { transactionId: token },
        {
          paymentStatus: capture.result.status === "COMPLETED" ? "Completed" : "Failed",
          transactionId: capture.result.id,
        },
        { new: true }
      );

      if (!donation) {
        return NextResponse.json({ error: "Donation not found" }, { status: 404 });
      }

      if (capture.result.status === "COMPLETED") {
        await NGO.findByIdAndUpdate(donation.ngoId, {
          $inc: { totalDonations: donation.amount, donationCount: 1 },
          $set: { lastDonationDate: new Date() },
        });
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/donate/success?donationId=${donation._id}`);
    } catch (error) {
      console.error("Error capturing PayPal payment:", error);
      return NextResponse.json(
        { error: "Failed to capture payment", details: error.message },
        { status: 500 }
      );
    }
  }

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

    // Assuming only admins can verify donations (adjust role as needed)
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
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