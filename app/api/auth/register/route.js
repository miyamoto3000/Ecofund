import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import NGO from "@/models/NGO";
import Donor from "@/models/Donar";

export async function POST(req) {
  try {
    await dbConnect();
    const { name, email, password, role, ...rest } = await req.json();

    console.log("Registration attempt:", { name, email, role }); // Debug log

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (role === "ngo") {
      user = await NGO.create({ name, email, password: hashedPassword, ...rest });
    } else if (role === "donor") {
      user = await Donor.create({ name, email, password: hashedPassword, ...rest });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    console.log("User registered:", user._id); // Debug log

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}