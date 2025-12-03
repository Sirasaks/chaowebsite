import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Explicitly set the cookie to expire immediately with the correct path
  cookieStore.set("token", "", { maxAge: 0, path: "/" });

  return NextResponse.json({ message: "ออกจากระบบเรียบร้อยแล้ว" });
}
