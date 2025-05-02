// /app/api/get-token/route.js
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    console.log("Token from cookie:", token); // Debug log
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }
    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Error fetching token:", error);
    return NextResponse.json(
      { error: "Failed to fetch token", details: error.message },
      { status: 500 }
    );
  }
}