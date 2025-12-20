"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

export default function ResetPasswordForm() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    // Redirect if no token
    if (!token) {
        // Note: In Server Component page we might handle this better, but keeping defensive check here
        if (typeof window !== "undefined") {
            router.replace("/login")
        }
        return null;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        if (password !== confirmPassword) {
            toast.error("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน")
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch("/api/shop/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            })

            const data = await res.json()

            if (res.ok) {
                setIsSuccess(true)
                toast.success("เปลี่ยนรหัสผ่านสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...")
                setTimeout(() => {
                    router.push("/login")
                }, 1500)
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด")
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="flex items-start justify-center dark:bg-gray-950 p-4 pt-8 md:pt-16">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>ตั้งรหัสผ่านใหม่</CardTitle>
                    <CardDescription>
                        กรุณากรอกรหัสผ่านใหม่ของคุณ
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">รหัสผ่านใหม่</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={isLoading || isSuccess}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : isSuccess ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังพาไปหน้าเข้าสู่ระบบ...
                                </>
                            ) : (
                                "บันทึกรหัสผ่านใหม่"
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter>
                    <Link
                        href="/login"
                        className="w-full text-center text-sm underline-offset-4 hover:underline"
                    >
                        กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                </CardFooter>
            </Card>
        </main>
    )
}
