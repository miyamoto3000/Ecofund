import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NGO from "@/models/NGO";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { ngoId, name, email, contactNumber, skills, availability, motivation } = body;

    if (!ngoId || !name || !email || !contactNumber || !motivation) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
          donorId = decoded.id;
        }
      } catch (err) {
        console.warn("Invalid token, proceeding with anonymous application:", err.message);
      }
    }

    const newApplication = {
      donorId,
      name,
      email,
      contactNumber,
      skills: skills || null,
      availability: availability || null,
      motivation,
      status: "Pending",
      date: new Date(),
    };

    ngo.volunteerApplications = [...(ngo.volunteerApplications || []), newApplication];
    await ngo.save({ validateBeforeSave: true });

    return NextResponse.json(
      { message: "Volunteer application submitted successfully", application: newApplication },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting volunteer application:", error);
    return NextResponse.json(
      { error: "Failed to submit volunteer application", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "ngo") {
      return NextResponse.json(
        { error: "Forbidden: NGO access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { applicationId, status } = body;

    if (!applicationId || !["Accepted", "Rejected"].includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: "Missing applicationId or invalid status",
        },
        { status: 400 }
      );
    }

    const ngo = await NGO.findOne({ "volunteerApplications._id": applicationId });
    if (!ngo) {
      return NextResponse.json(
        { error: "Volunteer application not found" },
        { status: 404 }
      );
    }

    const application = ngo.volunteerApplications.id(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: "Volunteer application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "Pending") {
      return NextResponse.json(
        { error: "Application already processed" },
        { status: 400 }
      );
    }

    application.status = status;
    await ngo.save({ validateBeforeSave: true });

    return NextResponse.json(
      {
        message: `Volunteer application status updated to ${status}`,
        application,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating volunteer application status:", error);
    return NextResponse.json(
      {
        error: "Failed to update volunteer application status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}