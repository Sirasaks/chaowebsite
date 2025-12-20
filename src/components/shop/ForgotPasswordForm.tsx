"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user) router.replace("/")
    }, [user, router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch("/api/shop/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(data.message)
                if (data.debugLink) {
                    console.log("Debug Link:", data.debugLink)
                }
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด")
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
        } finally {
            setIsLoading(false)
        }
    }

    if (user) return null

    return (
        <main className="flex items-start justify-center dark:bg-gray-950 p-4 pt-8 md:pt-16">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>ลืมรหัสผ่าน</CardTitle>
                    <CardDescription>
                        กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-2">
                            <Label htmlFor="email">อีเมล</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังส่ง...
                                </>
                            ) : (
                                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
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
