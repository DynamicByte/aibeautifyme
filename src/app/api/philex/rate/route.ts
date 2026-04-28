import { NextRequest, NextResponse } from "next/server";
import { calculateShippingRate } from "@/lib/philex";

export async function POST(req: NextRequest) {
  try {
    const { cartItems, recipient } = await req.json();

    if (!cartItems || !recipient) {
      return NextResponse.json(
        { error: "Missing cartItems or recipient" },
        { status: 400 }
      );
    }

    const sender = {
      province: process.env.TEST_STORE_PROVINCE || "",
      municipality: process.env.TEST_STORE_MUNICIPALITY || "",
      barangay: process.env.TEST_STORE_BARANGAY || "",
    };

    const declared_value = cartItems.reduce(
      (sum: number, i: any) => sum + (i.price || 0) * i.quantity,
      0
    );

    const result = await calculateShippingRate({
      type: "pouch",
      weight: 0.8,
      declared_value,
      sender_province: sender.province,
      sender_municipality: sender.municipality,
      sender_barangay: sender.barangay,

      recipient_province: recipient.province,
      recipient_municipality: recipient.municipality,
      recipient_barangay: recipient.barangay,
    });

    return NextResponse.json({
      success: true,
      rate: result,
    });
  } catch (err: any) {
    console.error("Rate API error:", err);

    return NextResponse.json(
      { success: false, error: err.message || "Rate failed" },
      { status: 500 }
    );
  }
}