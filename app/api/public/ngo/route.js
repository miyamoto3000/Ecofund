import connectDB from "@/lib/db";
import NGO from "@/models/NGO";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    // Fetch all NGOs, selecting only public fields
    const ngos = await NGO.find().select(
      "name category description coverImage"
    ); // Limit fields for performance

    if (!ngos || ngos.length === 0) {
      return NextResponse.json({ error: "No NGOs found" }, { status: 404 });
    }

    return NextResponse.json({ ngos }, { status: 200 });
  } catch (error) {
    console.error("Error fetching NGO list:", error);
    return NextResponse.json(
      { error: "Failed to fetch NGO list", details: error.message },
      { status: 500 }
    );
  }
}