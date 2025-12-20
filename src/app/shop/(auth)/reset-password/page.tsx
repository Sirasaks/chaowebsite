import { verifyShopSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/shop/ResetPasswordForm";
import { Suspense } from "react";

export default async function ResetPasswordPage() {
  const isLoggedIn = await verifyShopSession();

  if (isLoggedIn) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
