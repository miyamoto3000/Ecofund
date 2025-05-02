// /api/public/ngo/[id]/route.js
import connectDB from "@/lib/db";
import NGO from "@/models/NGO";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params; // Extract NGO ID from the URL

    // Fetch NGO by ID, including necessary fields
    const ngo = await NGO.findById(id).select(
      "name category description mission vision impact team events updates mediaGallery registrationDocs coverImage bankDetails upiId address city state country contactNumber socialMedia"
    );

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    return NextResponse.json({ ngo }, { status: 200 });
  } catch (error) {
    console.error("Error fetching public NGO data:", error);
    return NextResponse.json(
      { error: "Failed to fetch NGO", details: error.message },
      { status: 500 }
    );
  }
}