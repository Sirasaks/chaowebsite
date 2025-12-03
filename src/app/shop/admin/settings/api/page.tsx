"use client";

import { ApiSettingsForm } from "@/components/shop/admin/api-settings-form";


export default function ApiSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">ตั้งค่า API</h1>
            </div>
            <ApiSettingsForm />
        </div>
    );
}
