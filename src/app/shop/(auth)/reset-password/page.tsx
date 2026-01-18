import { verifyShopSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/shop/ResetPasswordForm";
import { Suspense } from "react";
import pool from "@/lib/db";
import crypto from "crypto";
import { getShopIdFromContext } from "@/lib/shop-helper";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const isLoggedIn = await verifyShopSession();

  if (isLoggedIn) {
    redirect("/");
  }

  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-500">ลิงก์ไม่ถูกต้อง</CardTitle>
            <CardDescription>ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default">
              <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shopId = await getShopIdFromContext();
  if (!shopId) {
    return <div>Error loading shop context</div>;
  }

  // Validate Token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const [resets] = await pool.query<RowDataPacket[]>(
    "SELECT created_at FROM password_resets WHERE token = ? AND shop_id = ?",
    [hashedToken, shopId]
  );

  let errorState = null;

  if (resets.length === 0) {
    errorState = "ลิงก์รีเซ็ตรหัสผ่านนี้ไม่ถูกต้อง หรือถูกใช้งานไปแล้ว";
  } else {
    const createdAt = new Date(resets[0].created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 1) {
      errorState = "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว (อายุการใช้งาน 1 ชั่วโมง)";
    }
  }

  if (errorState) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-500">ลิงก์ใช้งานไม่ได้</CardTitle>
            <CardDescription className="text-lg">{errorState}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">กรุณาขอรหัสผ่านใหม่ที่หน้าเข้าสู่ระบบ</p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="default">
                <Link href="/forgot-password">ขอรหัสผ่านใหม่</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
