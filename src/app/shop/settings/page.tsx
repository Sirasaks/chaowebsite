"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);

    // Password Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Email Form State
    const [emailData, setEmailData] = useState({
        newEmail: "",
        confirmEmailPassword: "", // Password needed to confirm email change
    });
    const [emailLoading, setEmailLoading] = useState(false);

    // --- Handlers ---

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.id]: e.target.value });
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailData({ ...emailData, [e.target.id]: e.target.value });
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/shop/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

            toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!emailData.newEmail || !emailData.newEmail.includes("@")) {
            toast.error("รูปแบบอีเมลไม่ถูกต้อง");
            return;
        }
        if (!emailData.confirmEmailPassword) {
            toast.error("กรุณาระบุรหัสผ่านเพื่อยืนยัน");
            return;
        }

        setEmailLoading(true);

        try {
            const res = await fetch("/api/shop/auth/change-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    newEmail: emailData.newEmail,
                    password: emailData.confirmEmailPassword,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

            toast.success("เปลี่ยนอีเมลสำเร็จ");
            setEmailData({ newEmail: "", confirmEmailPassword: "" });

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4 pt-8 md:pt-16 max-w-sm mx-auto">
            {/* Change Password Card */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>ตั้งค่ารหัสผ่าน</CardTitle>
                    <CardDescription>เปลี่ยนรหัสผ่านเพื่อความปลอดภัย</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                placeholder="กรอกรหัสผ่านปัจจุบัน"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">เช็ตรหัสผ่านใหม่</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="กรอกรหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="กรอกรหัสผ่านใหม่ อีกครั้ง"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก...</>
                            ) : "บันทึกรหัสผ่านใหม่"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Change Email Card */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>ตั้งค่าอีเมล</CardTitle>
                    <CardDescription>เปลี่ยนอีเมลที่ใช้เข้าสู่ระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newEmail">อีเมลใหม่</Label>
                            <Input
                                id="newEmail"
                                type="email"
                                placeholder="ตัวอย่าง: new-email@example.com"
                                value={emailData.newEmail}
                                onChange={handleEmailChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmEmailPassword">รหัสผ่านยืนยัน</Label>
                            <Input
                                id="confirmEmailPassword"
                                type="password"
                                placeholder="กรอกรหัสผ่านเพื่อยืนยันการเปลี่ยนอีเมล"
                                value={emailData.confirmEmailPassword}
                                onChange={handleEmailChange}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={emailLoading}>
                            {emailLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก...</>
                            ) : "บันทึกอีเมลใหม่"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
