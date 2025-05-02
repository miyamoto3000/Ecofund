// /app/api/ngo/[id]/route.js
import connectDB from "@/lib/db";
import NGO from "@/models/NGO";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
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

    const ngo = await NGO.findById(params.id).select("name campaigns");
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    if (ngo._id.toString() !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    return NextResponse.json({ ngo }, { status: 200 });
  } catch (error) {
    console.error("Error fetching NGO:", error);
    return NextResponse.json(
      { error: "Failed to fetch NGO", details: error.message },
      { status: 500 }
    );
  }
}