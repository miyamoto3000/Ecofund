// /api/ngos/route.js
import connectDB from "@/lib/db";
import NGO from "@/models/NGO";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

const uploadDir = path.join(process.cwd(), "public/uploads");

export async function GET(req) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No Token Found" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    const ngo = await NGO.findById(decoded.id).select(
      "-password -__v -createdAt -updatedAt -verificationDocuments -razorpayKeySecret"
    );
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    console.log("Fetched NGO for Profile:", ngo); // Debug log
    return NextResponse.json({ ngo }, { status: 200 });
  } catch (error) {
    console.error("Error fetching NGO:", error);
    return NextResponse.json(
      { error: "Failed to fetch NGO", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No Token Found" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type");
    let updateData = {};

    const saveFile = async (file, fieldName) => {
      if (!file || !(file instanceof File)) return null;

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
        "video/webm",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type for ${fieldName}`);
      }

      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (file.size > maxSize) {
        throw new Error(`File size exceeds limit for ${fieldName}`);
      }

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`; // Sanitize filename
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      return `/uploads/${fileName}`;
    };

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();

      // Handle text fields and nested objects
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string" && !key.startsWith("existing")) {
          try {
            updateData[key] = JSON.parse(value);
          } catch {
            updateData[key] = value;
          }
        }
      }

      // Handle cover image
      const coverImage = formData.get("coverImage");
      if (coverImage && coverImage instanceof File) {
        const filePath = await saveFile(coverImage, "coverImage");
        if (filePath) {
          updateData.coverImage = filePath;
          console.log("Cover Image Saved:", filePath); // Debug log
        }
      }

      // Handle media gallery
      const mediaGalleryFiles = formData.getAll("mediaGallery");
      const existingMediaGallery = formData
        .getAll("existingMediaGallery")
        .filter((item) => item)
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch (error) {
            console.error("Error parsing existingMediaGallery item:", error);
            return null;
          }
        })
        .filter(Boolean);
      let updatedMediaGallery = [...existingMediaGallery];

      if (mediaGalleryFiles.length > 0) {
        const validFiles = mediaGalleryFiles.filter((file) => file instanceof File);
        if (validFiles.length > 0) {
          const newMediaPaths = await Promise.all(
            validFiles.map((file) => saveFile(file, "mediaGallery"))
          ).then((paths) => paths.filter(Boolean));
          updatedMediaGallery = [...updatedMediaGallery, ...newMediaPaths];
        }
      }
      if (updatedMediaGallery.length > 0) {
        updateData.mediaGallery = updatedMediaGallery;
      }
      console.log("Updated Media Gallery:", updatedMediaGallery); // Debug log

      // Handle registration docs
      const registrationDocsFiles = formData.getAll("registrationDocs");
      const existingRegistrationDocs = formData
        .getAll("existingRegistrationDocs")
        .filter((item) => item)
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch (error) {
            console.error("Error parsing existingRegistrationDocs item:", error);
            return null;
          }
        })
        .filter(Boolean);
      let updatedRegistrationDocs = [...existingRegistrationDocs];

      if (registrationDocsFiles.length > 0) {
        const validFiles = registrationDocsFiles.filter(
          (file) => file instanceof File
        );
        if (validFiles.length > 0) {
          const newDocPaths = await Promise.all(
            validFiles.map((file) => saveFile(file, "registrationDocs"))
          ).then((paths) => paths.filter(Boolean));
          updatedRegistrationDocs = [...updatedRegistrationDocs, ...newDocPaths];
        }
      }
      if (updatedRegistrationDocs.length > 0) {
        updateData.registrationDocs = updatedRegistrationDocs;
      }
      console.log("Updated Registration Docs:", updatedRegistrationDocs); // Debug log
    } else if (contentType?.includes("application/json")) {
      updateData = await req.json();
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    // Update the NGO in the database
    const updatedNGO = await NGO.findByIdAndUpdate(decoded.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -__v -createdAt -updatedAt");

    if (!updatedNGO) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    console.log("Updated NGO:", updatedNGO); // Debug log
    return NextResponse.json(
      { ngo: updatedNGO, message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/ngos:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 }
    );
  }
}