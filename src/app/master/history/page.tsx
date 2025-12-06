"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, ShoppingBag, Calendar, User, Key, Loader2 } from "lucide-react"
import Link from "next/link"

interface Shop {
    id: number
    name: string
    subdomain: string
    expire_date: string
    created_at: string
    order_data: string | null
}

export default function MasterHistoryPage() {
    const { user, loading: authLoading } = useAuth()
    const [shops, setShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return

            try {
                const res = await fetch("/api/master/history")
                if (!res.ok) throw new Error("Failed to fetch history")
                const data = await res.json()
                setShops(data.shops)
            } catch (err) {
                console.error(err)
                setError("ไม่สามารถโหลดข้อมูลประวัติการสั่งซื้อได้")
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            if (user) {
                fetchHistory()
            } else {
                setLoading(false)
            }
        }
    }, [user, authLoading])

    if (authLoading || (loading && user)) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-2xl font-bold">กรุณาเข้าสู่ระบบ</h1>
                <p className="text-muted-foreground mt-2">คุณต้องเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ</p>
                <Button asChild className="mt-4">
                    <Link href="/login">เข้าสู่ระบบ</Link>
                </Button>
            </div>
        )
    }

    const getCredentials = (orderData: string | null) => {
        if (!orderData) return { username: "-", password: "-" }
        try {
            const parsed = JSON.parse(orderData)
            return {
                username: parsed.username || "-",
                password: parsed.password || "-"
            }
        } catch (e) {
            return { username: "-", password: "-" }
        }
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">ประวัติการสั่งซื้อ</h1>
                <p className="text-muted-foreground mt-2">
                    รายการร้านค้าที่คุณได้ทำการสั่งซื้อและเป็นเจ้าของ
                </p>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {!loading && shops.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-slate-50">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">ยังไม่มีประวัติการสั่งซื้อ</h3>
                    <p className="text-muted-foreground mt-2">คุณยังไม่ได้ทำการเปิดร้านค้าใดๆ</p>
                    <Button asChild className="mt-6">
                        <Link href="/packages">ดูแพ็คเกจเปิดร้าน</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {shops.map((shop) => {
                        const { username, password } = getCredentials(shop.order_data)
                        return (
                            <Card key={shop.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="bg-slate-50/50 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{shop.name}</CardTitle>
                                            <CardDescription className="mt-1 flex items-center gap-1">
                                                <span className="font-mono text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                                                    {shop.subdomain}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <Badge variant={new Date(shop.expire_date) > new Date() ? "default" : "destructive"}>
                                            {new Date(shop.expire_date) > new Date() ? "Active" : "Expired"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground mb-2">ข้อมูลผู้ดูแลระบบ</div>
                                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Username:</span>
                                            </div>
                                            <span className="font-mono font-medium">{username}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                                            <div className="flex items-center gap-2">
                                                <Key className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Password:</span>
                                            </div>
                                            <span className="font-mono font-medium">{password}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                        <Calendar className="h-3 w-3" />
                                        <span>หมดอายุ: {new Date(shop.expire_date).toLocaleDateString('th-TH')}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 pt-4">
                                    <Button asChild className="w-full" variant="outline">
                                        <a
                                            href={process.env.NODE_ENV === 'development'
                                                ? `http://${shop.subdomain}.localhost:3000`
                                                : `https://${shop.subdomain}.chaoweb.site`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            ไปที่ร้านค้า
                                        </a>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
