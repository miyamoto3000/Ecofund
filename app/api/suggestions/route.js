import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NGO from "@/models/NGO";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { ngoId, name, email, suggestion } = body;

    if (!ngoId || !suggestion) {
      return NextResponse.json(
        { error: "Missing required fields (ngoId and suggestion are required)" },
        { status: 400 }
      );
    }

    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const token = req.cookies.get("token")?.value;
    let donorId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === "donor") {
          donorId = decoded.id; // Ensure donorId is a valid ObjectId
        }
      } catch (err) {
        console.warn("Invalid token, proceeding with anonymous suggestion:", err.message);
      }
    }

    const newSuggestion = {
      donorId: donorId ? donorId : undefined, // Only set if valid
      name: name || "Anonymous",
      email: email || null,
      suggestion,
      date: new Date(),
    };

    ngo.suggestions = [...(ngo.suggestions || []), newSuggestion];
    await ngo.save({ validateBeforeSave: true });

    return NextResponse.json(
      { message: "Suggestion submitted successfully", suggestion: newSuggestion },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting suggestion:", error);
    return NextResponse.json(
      { error: "Failed to submit suggestion", details: error.message },
      { status: 500 }
    );
  }
}