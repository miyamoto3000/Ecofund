import { NextResponse } from "next/server";
import { authenticateUser } from "@/middlewares/authMiddleware";
import NGO from "@/models/NGO";
import Donor from "@/models/Donar";

export async function GET(req) {
  await authenticateUser(req);
  
  let user;
  if (req.user.role === "ngo") {
    user = await NGO.findById(req.user.id);
  } else if (req.user.role === "donor") {
    user = await Donor.findById(req.user.id);
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user, { status: 200 });
}
