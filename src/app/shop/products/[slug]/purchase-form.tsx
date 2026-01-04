"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, LogIn } from "lucide-react";
import { Product } from "@/lib/product-service";
import { useAuth } from "@/context/AuthContext";

export function ProductPurchaseForm({ product, initialUser }: { product: Product, initialUser?: any }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user: clientUser, setUser } = useAuth();

    // Use initialUser for SSR, then switch to clientUser when hydration/auth completes
    // Note: clientUser is null initially, so we prioritize initialUser if defined
    const user = initialUser !== undefined ? initialUser : clientUser;

    const [quantity, setQuantity] = useState(1);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [requestId, setRequestId] = useState<string | null>(null);

    let maxQuantity = 0;
    if (product.type === 'account') {
        maxQuantity = product.account ? product.account.split("\n").filter(Boolean).length : 0;
    } else if (product.type === 'api') {
        maxQuantity = product.stock ?? 0;
    }

    const hasStock = (product.type === "account" || product.type === "api") ? maxQuantity > 0 : true;

    const changeQuantity = (delta: number) => {
        setQuantity((prev) => {
            const next = prev + delta;
            if (product.type === "account" || product.type === "api") return Math.max(1, Math.min(next, maxQuantity));
            return Math.max(1, next);
        });
    };

    const handleClick = () => {
        // Check if user is logged in
        if (!user) {
            router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        if (product.type === "form" && (!formData.username || !formData.password)) {
            toast.error("กรุณากรอก Username และ Password");
            return;
        }

        // สร้าง Request ID ใหม่ทุกครั้งที่เปิด dialog
        setRequestId(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        setShowConfirm(true);
    };

    const confirmOrder = async () => {
        // ป้องกัน double submission
        if (submitting || !requestId) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/shop/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Request-Id": requestId,
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity,
                    formData: product.type === "form" ? formData : undefined,
                    expectedPrice: Number(product.price),
                    requestId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            // Handle different response statuses
            if (data.orderId) {
                if (data.warning) {
                    // API timeout case - order is processing
                    toast.warning(data.warning, { duration: 5000 });
                } else {
                    // Success
                    toast.success(data.message || "สั่งซื้อสำเร็จ!");
                }
                setShowConfirm(false);
                setRequestId(null);
                if (user) {
                    const totalPrice = Number(product.price) * quantity;
                    setUser({ ...user, credit: Number(user.credit) - totalPrice });
                }
                router.refresh();
                router.push("/history");
            } else {
                if (user) {
                    const totalPrice = Number(product.price) * quantity;
                    setUser({ ...user, credit: Number(user.credit) - totalPrice });
                }
                toast.success("สั่งซื้อสำเร็จ!");
                setShowConfirm(false);
                setRequestId(null);
                router.refresh();
                router.push("/history");
            }
        } catch (error: any) {
            toast.error(error.message);
            setSubmitting(false);
        }
    };

    return (
        <>
            <Card>
                <CardContent className="flex flex-col gap-4 ">
                    {product.type === "api" && (
                        <>
                            <p className="text-sm text-muted-foreground">สินค้าพร้อมส่ง: {maxQuantity} ชิ้น</p>
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => changeQuantity(-1)} disabled={!hasStock || quantity <= 1 || submitting}>-</Button>
                                <Input type="number" value={quantity} readOnly className="grow text-center" disabled={!hasStock || submitting} />
                                <Button variant="outline" size="icon" onClick={() => changeQuantity(1)} disabled={!hasStock || quantity >= maxQuantity || submitting}>+</Button>
                            </div>
                        </>
                    )}
                    {product.type === "account" && (
                        <>
                            <p className="text-sm text-muted-foreground">จำนวนคงเหลือ: {maxQuantity} ชิ้น</p>
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => changeQuantity(-1)} disabled={!hasStock || quantity <= 1 || submitting}>-</Button>
                                <Input type="number" value={quantity} readOnly className="grow text-center" disabled={!hasStock || submitting} />
                                <Button variant="outline" size="icon" onClick={() => changeQuantity(1)} disabled={!hasStock || quantity >= maxQuantity || submitting}>+</Button>
                            </div>
                        </>
                    )}
                    {product.type === "form" && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="purchase_username">Username</Label>
                                <Input
                                    id="purchase_username"
                                    name="purchase_username"
                                    value={formData.username}
                                    placeholder="กรอก Username ของคุณ"
                                    disabled={submitting}
                                    autoComplete="off"
                                    data-form-type="other"
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="purchase_password">Password</Label>
                                <Input
                                    id="purchase_password"
                                    name="purchase_password"
                                    type="text"
                                    value={formData.password}
                                    placeholder="กรอกรหัสผ่าน"
                                    disabled={submitting}
                                    autoComplete="off"
                                    data-form-type="other"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" onClick={handleClick} disabled={submitting || !hasStock}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {!user && <LogIn className="mr-2 h-4 w-4" />}
                        {submitting ? "กำลังดำเนินการ..." : !hasStock ? "สินค้าหมด" : !user ? "เข้าสู่ระบบเพื่อสั่งซื้อสินค้า" : "สั่งซื้อสินค้า"}
                    </Button>
                </CardFooter>
            </Card>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการสั่งซื้อ</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการสั่งซื้อ <strong>{product.name}</strong>
                            {product.type === "account" && ` จำนวน ${quantity} ชิ้น`} ใช่หรือไม่?
                            <br />
                            ราคารวม: <strong>{(
                                (user?.role === 'agent' && (user.agent_discount || 0) > 0)
                                    ? (Number(product.price) * (1 - (user.agent_discount || 0) / 100) * quantity).toFixed(2)
                                    : (Number(product.price) * quantity).toFixed(2)
                            )}</strong> บาท {user?.role === 'agent' && (user.agent_discount || 0) > 0 && <span className="text-xs text-muted-foreground">(รวมส่วนลดแล้ว)</span>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmOrder} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ยืนยัน
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
