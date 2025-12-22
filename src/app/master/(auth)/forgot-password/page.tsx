import { verifyMasterSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import MasterForgotPasswordForm from "./MasterForgotPasswordForm";

export default async function ForgotPasswordPage() {
    const isLoggedIn = await verifyMasterSession();

    if (isLoggedIn) {
        redirect("/");
    }

    return <MasterForgotPasswordForm />;
}
