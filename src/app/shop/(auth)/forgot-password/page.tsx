import { verifyShopSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import ForgotPasswordForm from "@/components/shop/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const isLoggedIn = await verifyShopSession();

  if (isLoggedIn) {
    redirect("/");
  }

  return <ForgotPasswordForm />;
}
