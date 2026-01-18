import { verifyShopSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import SignupForm from "@/components/shop/SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description: "สมัครสมาชิกใหม่",
};

export default async function RegisterPage() {
  const isLoggedIn = await verifyShopSession();

  if (isLoggedIn) {
    redirect("/");
  }

  return <SignupForm />;
}
