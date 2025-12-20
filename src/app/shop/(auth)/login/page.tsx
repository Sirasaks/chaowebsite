import { verifyShopSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/shop/LoginForm";

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
