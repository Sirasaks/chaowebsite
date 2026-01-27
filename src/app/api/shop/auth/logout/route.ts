import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Clear the single token cookie
  cookieStore.set("token", "", { maxAge: 0, path: "/" });
  cookieStore.set("refresh_token", "", { maxAge: 0, path: "/" }); // Clear legacy refresh_token if exists

  return NextResponse.json({ message: "ออกจากระบบเรียบร้อยแล้ว" });
}
