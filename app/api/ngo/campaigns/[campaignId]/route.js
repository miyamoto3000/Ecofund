// /app/api/ngo/campaigns/[campaignId]/route.js
import connectDB from "@/lib/db";
import NGO from "@/models/NGO";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
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

    const { status } = await req.json();
    const ngo = await NGO.findById(decoded.id);
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const campaign = ngo.campaigns.id(params.campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    campaign.status = status || "Completed";
    await ngo.save();

    return NextResponse.json(
      { message: "Campaign updated successfully", campaign },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
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

    const ngo = await NGO.findById(decoded.id);
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const campaignIndex = ngo.campaigns.findIndex(
      (camp) => camp._id.toString() === params.campaignId
    );
    if (campaignIndex === -1) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    ngo.campaigns.splice(campaignIndex, 1);
    await ngo.save();

    return NextResponse.json(
      { message: "Campaign deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign", details: error.message },
      { status: 500 }
    );
  }
}