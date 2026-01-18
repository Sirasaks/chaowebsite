"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ExternalLink,
    Store,
    Calendar,
    User,
    Key,
    Clock,
    Globe,
    Copy,
    Check,
} from "lucide-react"
import Link from "next/link"

interface Shop {
    id: number
    name: string
    subdomain: string
    expire_date: string
    created_at: string
    order_data: string | null
}

interface MasterHistoryClientProps {
    initialShops: Shop[]
}

export function MasterHistoryClient({ initialShops }: MasterHistoryClientProps) {
    const [shops] = useState<Shop[]>(initialShops)
    const [copiedId, setCopiedId] = useState<number | null>(null)

    const copyToClipboard = (text: string, id: number) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
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

    const getDaysRemaining = (expireDate: string) => {
        const now = new Date()
        const expire = new Date(expireDate)
        const diff = expire.getTime() - now.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto py-12 px-6">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">ร้านค้าของฉัน</h1>
                    <p className="text-slate-500 mt-2">รายการร้านค้าที่คุณเปิดใช้งาน</p>
                </div>

                {shops.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                            <Store className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">ยังไม่มีร้านค้า</h3>
                        <p className="text-slate-500 mt-2">คุณยังไม่ได้เปิดร้านค้าใดๆ</p>
                        <Button asChild className="mt-6">
                            <Link href="/shop">เปิดร้านค้าเลย</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {shops.map((shop, index) => {
                            const { username, password } = getCredentials(shop.order_data)
                            const daysRemaining = getDaysRemaining(shop.expire_date)
                            const isExpired = daysRemaining <= 0
                            const isWarning = daysRemaining > 0 && daysRemaining <= 7

                            return (
                                <Card
                                    key={shop.id}
                                    className={`bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${isExpired ? "opacity-75" : ""}`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <CardContent className="p-0">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Left Section - Shop Info */}
                                            <div className="flex-1 p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <Store className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-slate-900">{shop.name}</h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Globe className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-sm text-slate-500">{shop.subdomain}.chaoweb.site</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={isExpired ? "destructive" : isWarning ? "warning" : "success"}
                                                        className="shrink-0"
                                                    >
                                                        {isExpired ? "หมดอายุ" : isWarning ? `เหลือ ${daysRemaining} วัน` : "Active"}
                                                    </Badge>
                                                </div>

                                                {/* Credentials */}
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="bg-slate-50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                                            <User className="h-3 w-3" />
                                                            Username
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-mono text-sm font-medium">{username}</span>
                                                            <button
                                                                onClick={() => copyToClipboard(username, shop.id * 10 + 1)}
                                                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                                            >
                                                                {copiedId === shop.id * 10 + 1 ? (
                                                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                                                ) : (
                                                                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                                            <Key className="h-3 w-3" />
                                                            Password
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-mono text-sm font-medium">{password}</span>
                                                            <button
                                                                onClick={() => copyToClipboard(password, shop.id * 10 + 2)}
                                                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                                            >
                                                                {copiedId === shop.id * 10 + 2 ? (
                                                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                                                ) : (
                                                                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className="flex items-center gap-6 text-xs text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>สร้างเมื่อ {new Date(shop.created_at).toLocaleDateString('th-TH')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>หมดอายุ {new Date(shop.expire_date).toLocaleDateString('th-TH')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section - Action */}
                                            <div className="lg:w-48 p-6 lg:border-l bg-slate-50/50 flex items-center justify-center">
                                                <Button asChild className="w-full" variant={isExpired ? "outline" : "default"}>
                                                    <a
                                                        href={process.env.NODE_ENV === 'development'
                                                            ? `http://${shop.subdomain}.localhost:3000`
                                                            : `https://${shop.subdomain}.chaoweb.site`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        {isExpired ? "ดูร้านค้า" : "จัดการร้าน"}
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
