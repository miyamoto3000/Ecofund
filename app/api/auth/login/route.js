import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import NGO from "@/models/NGO";
import Donor from "@/models/Donar";

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password, role } = await req.json();

    console.log("Login attempt:", { email, role }); // Debug log

    let user;
    if (role === "ngo") {
      user = await NGO.findOne({ email }).select("+password"); // Explicitly select password
    } else if (role === "donor") {
      user = await Donor.findOne({ email }).select("+password"); // Explicitly select password
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch for email:", email);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("Token generated:", token); // Debug log

    const response = NextResponse.json({ message: "Login successful" }, { status: 200 });
    response.headers.append(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    ); // 1 day in seconds

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}