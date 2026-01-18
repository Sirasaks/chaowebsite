import { verifyShopSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/shop/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
  description: "เข้าสู่ระบบเพื่อใช้งาน",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const isLoggedIn = await verifyShopSession();
  const { callbackUrl } = await searchParams;
  const destination = callbackUrl || "/";

  if (isLoggedIn) {
    redirect(destination);
  }

  return <LoginForm />;
}
