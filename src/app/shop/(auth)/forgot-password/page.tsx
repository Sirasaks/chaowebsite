import { verifyShopSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import ForgotPasswordForm from "@/components/shop/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ลืมรหัสผ่าน",
  description: "ขอรหัสผ่านใหม่",
};

export default async function ForgotPasswordPage() {
  const isLoggedIn = await verifyShopSession();

  if (isLoggedIn) {
    redirect("/");
  }

  return <ForgotPasswordForm />;
}
