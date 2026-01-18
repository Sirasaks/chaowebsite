"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, AlertCircle, ChevronLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { THAI_BANKS } from "@/lib/thai-banks";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopupSlipPage() {
    const { user, setUser } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [bankDetails, setBankDetails] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [checking, setChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchBankDetails = async () => {
            try {
                const res = await fetch("/api/shop/settings/payment");
                if (res.ok) {
                    const data = await res.json();
                    if (data.bank_transfer_enabled === "false") {
                        toast.error("ช่องทางการเติมเงินนี้ปิดปรับปรุง");
                        router.push("/topup");
                        return;
                    }
                    setBankDetails(data);
                    setChecking(false);
                } else {
                    setChecking(false);
                }
            } catch (error) {
                console.error("Error fetching bank details:", error);
                setChecking(false);
            }
        };
        fetchBankDetails();
    }, [router]);

    if (checking) {
        return null;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (loading) return; // ป้องกัน double submission

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            handleUpload(selectedFile);
        }
    };

    const handleUpload = async (uploadFile: File) => {
        setLoading(true);

        try {
            // Check if bank account has been changed before uploading
            const checkRes = await fetch("/api/shop/settings/payment");
            if (checkRes.ok) {
                const currentData = await checkRes.json();
                if (currentData.bank_account_number !== bankDetails?.bank_account_number) {
                    toast.error("เลขบัญชีถูกเปลี่ยนแปลง โปรดรีเฟรชหน้าเว็บ", {
                        action: {
                            label: "รีเฟรช",
                            onClick: () => window.location.reload(),
                        },
                    });
                    setLoading(false);
                    setFile(null);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                    return;
                }
            }

            const formData = new FormData();
            formData.append("file", uploadFile);

            const res = await fetch("/api/shop/topup/easyslip", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาดในการตรวจสอบสลิป");
            }

            toast.success(`เติมเงินสำเร็จ! ได้รับ ${data.amount} เครดิต`);

            // Update user credit locally
            if (user) {
                setUser({ ...user, credit: Number(user.credit || 0) + Number(data.amount) });
            }

            // Reset form
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-md">
            <Link href="/topup" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" />
                ย้อนกลับ
            </Link>

            <Card className="border shadow-lg bg-card text-card-foreground backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        เติมเงินผ่านธนาคาร
                    </CardTitle>
                    <CardDescription>
                        อัพโหลดสลิปโอนเงินเพื่อเติมเครดิตอัตโนมัติ
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">ธนาคาร</span>
                            <span className="font-medium flex items-center gap-2">
                                {bankDetails?.bank_code ? (
                                    (() => {
                                        const bank = THAI_BANKS.find(b => b.code === bankDetails.bank_code);
                                        return (
                                            <>
                                                {bank ? (
                                                    <div className="h-6 w-6 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-card text-card-foreground">
                                                        <img src={bank.logo} alt={bank.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="h-6 w-6 rounded-full bg-gray-200" />
                                                )}
                                                {bank?.name || bankDetails.bank_code}
                                            </>
                                        );
                                    })()
                                ) : (
                                    <span className="text-muted-foreground">กำลังโหลด...</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">เลขที่บัญชี</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-lg tracking-wide">
                                    {bankDetails?.bank_account_number || "กำลังโหลด..."}
                                </span>
                                {bankDetails?.bank_account_number && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(bankDetails.bank_account_number);
                                            toast.success("คัดลอกเลขบัญชีแล้ว");
                                        }}
                                        className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                                        title="คัดลอกเลขบัญชี"
                                    >
                                        <Copy className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">ชื่อบัญชี</span>
                            <span className="font-medium">
                                {bankDetails?.bank_account_name || "กำลังโหลด..."}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-dashed">
                            <span className="text-sm text-muted-foreground ">ยอดโอนขั้นต่ำ</span>
                            <span className="font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">10.00 บาท</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="slip">รูปภาพสลิป</Label>
                            <div
                                className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                                onClick={() => !loading && fileInputRef.current?.click()}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 text-primary animate-spin mb-2" />
                                        <p className="text-sm text-muted-foreground">กำลังตรวจสอบสลิป...</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">คลิกเพื่อเลือกรูปภาพ</p>
                                    </>
                                )}
                                <Input
                                    id="slip"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">ข้อแนะนำ</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>รองรับสลิปจากทุกธนาคาร</li>
                                <li>ระบบจะตรวจสอบยอดเงินและเติมเครดิตให้อัตโนมัติ</li>
                                <li>หากพบปัญหา กรุณาติดต่อแอดมิน</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
