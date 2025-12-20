"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
import ReCAPTCHA from "react-google-recaptcha"

export default function SignupForm() {
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const recaptchaRef = useRef<ReCAPTCHA>(null)
    const { user, setUser } = useAuth()

    const router = useRouter()

    useEffect(() => {
        if (user) router.replace("/")
    }, [user, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSuccess(false)

        if (password !== confirmPassword) {
            toast.error("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน")
            return
        }

        if (!captchaToken) {
            toast.error("กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ")
            return
        }

        setIsSubmitting(true)

        try {
            const res = await fetch("/api/shop/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, captchaToken }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

            setUser({ username: data.user.username, credit: Number(data.user.credit || 0), role: data.user.role })
            toast.success("สมัครสมาชิกสำเร็จ!")
            setIsSuccess(true)
            router.push("/")
            router.refresh()

        } catch (err: any) {
            toast.error(err.message)
            setIsSuccess(false)
            recaptchaRef.current?.reset()
            setCaptchaToken(null)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (user) return null

    return (
        <main className="flex items-start justify-center dark:bg-gray-950 p-4 pt-8 md:pt-16">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>สร้างบัญชีใหม่</CardTitle>
                    <CardDescription>กรอกข้อมูลด้านล่างเพื่อเริ่มต้นใช้งาน</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">ชื่อผู้ใช้</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="ชื่อผู้ใช้"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">อีเมล</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="อีเมล"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">รหัสผ่าน</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="รหัสผ่าน"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">ยืนยันรหัสผ่าน</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="ยืนยันรหัสผ่าน"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                                onChange={(token) => setCaptchaToken(token)}
                                theme="light"
                            />
                        </div>

                        <div className="pt-6">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "กำลังสมัคร..." : "สมัครสมาชิก"}
                            </Button>
                        </div>
                    </form>
                </CardContent>

                <CardFooter className="flex-col gap-4 pt-0">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">หรือ</span>
                        </div>
                    </div>

                    <div className="mt-4 text-center text-sm">
                        มีบัญชีอยู่แล้ว? <Link href="/login" className="underline">เข้าสู่ระบบ</Link>
                    </div>
                </CardFooter>
            </Card>
        </main>
    )
}
