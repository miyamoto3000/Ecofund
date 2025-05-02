// /app/api/campaigns/public/route.js
import connectDB from "@/lib/db";
import NGO from "@/models/NGO";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const ngos = await NGO.find({}, "name campaigns").lean();
    const campaigns = ngos
      .flatMap((ngo) =>
        Array.isArray(ngo.campaigns) ? ngo.campaigns.map((campaign) => ({
          ...campaign,
          ngoId: ngo._id,
          ngoName: ngo.name,
        })) : []
      )
      .filter((campaign) => campaign && campaign.status === "Active")
      .sort((a, b) => b.startDate - a.startDate)
      .slice(0, 10);

    return NextResponse.json({ campaigns }, { status: 200 });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns", details: error.message },
      { status: 500 }
    );
  }
}