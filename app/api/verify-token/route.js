// /app/api/verify-token/route.js
import connectDB from "@/lib/db";
import NGO from "@/models/NGO";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    console.log("Token from cookie:", token); // Debug log

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const ngo = await NGO.findById(decoded.id).select("name campaigns");
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    return NextResponse.json({ ngo }, { status: 200 });
  } catch (error) {
    console.error("Error verifying token or fetching NGO:", error);
    return NextResponse.json(
      { error: "Failed to verify token", details: error.message },
      { status: 500 }
    );
  }
}