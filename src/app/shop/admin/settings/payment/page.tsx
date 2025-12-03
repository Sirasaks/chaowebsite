import { PaymentSettingsForm } from "@/components/shop/admin/payment-settings-form";

export default function PaymentSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">ตั้งค่าการชำระเงิน</h1>
            </div>
            <PaymentSettingsForm />
        </div>
    );
}
