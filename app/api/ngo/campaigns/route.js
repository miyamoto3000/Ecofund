// /app/api/ngo/campaigns/route.js
import connectDB from "@/lib/db";
import NGO from "@/models/NGO";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { title, agenda, targetAmount, endDate } = await req.json();

    if (!title || !agenda || !targetAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ngo = await NGO.findById(decoded.id);
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const newCampaign = {
      title,
      agenda,
      targetAmount,
      raisedAmount: 0,
      status: "Active",
      startDate: new Date(),
      endDate: endDate ? new Date(endDate) : null,
    };

    ngo.campaigns.push(newCampaign);
    await ngo.save();

    return NextResponse.json(
      { message: "Campaign created successfully", campaign: newCampaign },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign", details: error.message },
      { status: 500 }
    );
  }
}