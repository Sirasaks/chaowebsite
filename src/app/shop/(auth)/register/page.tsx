import { verifyShopSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import SignupForm from "@/components/shop/SignupForm";

export default async function RegisterPage() {
  const isLoggedIn = await verifyShopSession();

  if (isLoggedIn) {
    redirect("/");
  }

  return <SignupForm />;
}
