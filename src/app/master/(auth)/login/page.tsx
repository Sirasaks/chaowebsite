"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

export default function MasterLoginPage() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user, setUser } = useAuth()

    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    useEffect(() => {
        if (user) router.replace(callbackUrl)
    }, [user, callbackUrl, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")
        setIsSuccess(false)
        setIsSubmitting(true)

        try {
            const res = await fetch("/api/master/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: username, password }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

            setUser({ username: data.user.username, credit: data.user.credit, role: data.user.role })
            toast.success("เข้าสู่ระบบสำเร็จ")
            setIsSuccess(true)
            router.push(callbackUrl)
            router.refresh()

        } catch (err: any) {
            toast.error(err.message)
            setIsSuccess(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (user) return null

    return (
        <main className="flex items-start justify-center p-4 pt-8 md:pt-16">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>เข้าสู่ระบบ</CardTitle>
                    <CardDescription>ยินดีต้อนรับกลับมา! กรุณาเข้าสู่ระบบ</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">ชื่อผู้ใช้ / อีเมล</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="ชื่อผู้ใช้ หรือ อีเมล"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">รหัสผ่าน</Label>
                                    <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                                        ลืมรหัสผ่าน?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="รหัสผ่าน"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {message && (
                            <p className={`text-sm font-medium pt-4 ${isSuccess ? "text-green-500" : "text-destructive"}`}>
                                {message}
                            </p>
                        )}

                        <div className="pt-6">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                            </Button>
                        </div>
                    </form>
                </CardContent>

                <CardFooter className="flex-col pt-0">
                    <div className="mt-4 text-center text-sm">
                        ยังไม่มีบัญชี? <Link href="/register" className="underline">สมัครสมาชิก</Link>
                    </div>
                </CardFooter>
            </Card>
        </main>
    )
}
