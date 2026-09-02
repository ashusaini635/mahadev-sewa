import { NextResponse } from "next/server";
import { createPasswordResetRequest } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const trimmedPhone = phone.trim();
    const result = await createPasswordResetRequest(trimmedPhone);

    if (!result.found) {
      return NextResponse.json(
        { error: "No member found registered with this phone number." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset request submitted. Admin will reset your password shortly.",
    });
  } catch (error) {
    console.error("Error creating password reset request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
