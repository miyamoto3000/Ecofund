import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Donation from "@/models/Donation";

export async function GET(req) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id || decoded.role !== "ngo") {
      return NextResponse.json({ error: "Invalid token or role" }, { status: 403 });
    }

    const pendingDonations = await Donation.find({
      ngoId: decoded.id,
      paymentStatus: "Pending",
    }).select("amount paymentMethod");

    return NextResponse.json({ pendingDonations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pending donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending donations", details: error.message },
      { status: 500 }
    );
  }
}