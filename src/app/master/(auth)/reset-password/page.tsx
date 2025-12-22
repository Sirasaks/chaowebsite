import { verifyMasterSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import MasterResetPasswordForm from "./MasterResetPasswordForm";
import { Suspense } from "react";

export default async function ResetPasswordPage() {
    const isLoggedIn = await verifyMasterSession();

    if (isLoggedIn) {
        redirect("/");
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MasterResetPasswordForm />
        </Suspense>
    );
}
