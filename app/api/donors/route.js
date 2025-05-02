import connectDB from "@/lib/db";
import Donor from "@/models/Donar";
import NGO from "@/models/NGO"; // Import NGO model
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    // ✅ Get the token from cookies
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No Token Found" }, { status: 401 });
    }

    // ✅ Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    // ✅ Fetch the logged-in Donor using ID
    const donor = await Donor.findById(decoded.id).select("-password -__v");
    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    // Fetch list of NGOs
    const ngos = await NGO.find().select(
      "name category description coverImage city"
    );

    return NextResponse.json({ donor, ngos }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch Donor", details: error.message }, { status: 500 });
  }
}