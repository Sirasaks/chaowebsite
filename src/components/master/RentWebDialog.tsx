"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RentWebDialogProps {
    isOpen: boolean
    onClose: () => void
    packagePrice: number
    packageName: string
    userCredit: number
}

export function RentWebDialog({ isOpen, onClose, packagePrice, packageName, userCredit }: RentWebDialogProps) {
    const [step, setStep] = useState<"form" | "success">("form")
    const [loading, setLoading] = useState(false)
    const [shopName, setShopName] = useState("")
    const [subdomain, setSubdomain] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [operationType, setOperationType] = useState<"new" | "renew">("new")
    const [myShops, setMyShops] = useState<any[]>([])
    const router = useRouter()

    // Fetch shops when dialog opens or switch to Renew
    useState(() => {
        if (isOpen) {
            fetch("/api/master/history")
                .then(res => res.json())
                .then(data => {
                    if (data.shops) setMyShops(data.shops)
                })
                .catch(err => console.error(err))
        }
    })

    const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setShopName(val)
        // Auto-generate subdomain from shop name (simple logic)
        // Only keep english and numbers for subdomain
        const generated = val.toLowerCase().replace(/[^a-z0-9]/g, "")
        setSubdomain(generated)
    }

    const handleSubmit = async () => {
        if (operationType === "new") {
            if (!shopName || !username || !password) {
                toast.error("กรุณากรอกข้อมูลให้ครบถ้วน")
                return
            }
            if (subdomain.length < 3) {
                toast.error("ชื่อเว็บไซต์ (Subdomain) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร")
                return
            }
        } else {
            if (!subdomain) {
                toast.error("กรุณาเลือกร้านค้าที่ต้องการต่ออายุ")
                return
            }
        }

        if (userCredit < packagePrice) {
            toast.error("เครดิตไม่เพียงพอ")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/master/rent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopName: operationType === "new" ? shopName : undefined,
                    subdomain,
                    username: operationType === "new" ? username : undefined,
                    password: operationType === "new" ? password : undefined,
                    operationType,
                    packagePrice
                })
            })

            const data = await res.json()

            if (res.ok) {
                setStep("success")
                toast.success(operationType === "new" ? "สร้างเว็บไซต์สำเร็จ!" : "ต่ออายุสำเร็จ!")
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด")
            }
        } catch (error) {
            console.error("Rent error:", error)
            toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (step === "success") {
            // Refresh page or redirect to history
            window.location.href = "/history"
        } else {
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">เช่าเว็บไซต์</DialogTitle>
                    <DialogDescription>
                        ซื้อเว็บไซต์สำหรับใช้งาน ราคาเช่าใหม่ ฿{packagePrice.toFixed(2)} | ต่ออายุ ฿{packagePrice.toFixed(2)}
                    </DialogDescription>
                </DialogHeader>

                {step === "form" ? (
                    <div className="space-y-6 py-4">
                        {/* Operation Type */}
                        <div className="space-y-2">
                            <Label>ประเภทการดำเนินการ *</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`border-2 rounded-lg p-4 cursor-pointer relative transition-all ${operationType === "new" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                                    onClick={() => setOperationType("new")}
                                >
                                    {operationType === "new" && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</div>
                                    )}
                                    <div className="font-bold mb-1">เช่าใหม่</div>
                                    <div className="text-xs text-gray-500">สร้างเว็บไซต์ใหม่</div>
                                </div>

                                <div
                                    className={`border-2 rounded-lg p-4 cursor-pointer relative transition-all ${operationType === "renew" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                                    onClick={() => setOperationType("renew")}
                                >
                                    <div className="font-bold mb-1">ต่ออายุ</div>
                                    <div className="text-xs text-gray-500">ต่ออายุเว็บไซต์ที่มีอยู่แล้ว</div>
                                </div>
                            </div>
                        </div>

                        {operationType === "new" ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="subdomain">ชื่อเว็บไซต์ (ภาษาอังกฤษ) *</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="subdomain"
                                            placeholder="yourname"
                                            value={subdomain}
                                            onChange={(e) => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")
                                                setSubdomain(val)
                                                setShopName(val)
                                            }}
                                            className="font-bold text-blue-600"
                                        />
                                        <span className="text-sm font-bold text-gray-500">.localhost:3000</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        ใช้สำหรับเข้าสู่เว็บไซต์
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="username">ผู้ใช้ (Admin) *</Label>
                                    <Input
                                        id="username"
                                        placeholder="กรุณากรอกชื่อผู้ใช้"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">รหัสผ่านผู้ดูแลระบบ *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="......"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label>เลือกร้านค้าที่ต้องการต่ออายุ *</Label>
                                {myShops.length > 0 ? (
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={subdomain}
                                        onChange={(e) => setSubdomain(e.target.value)}
                                    >
                                        <option value="">-- กรุณาเลือก --</option>
                                        {myShops.map((shop: any) => (
                                            <option key={shop.id} value={shop.subdomain}>
                                                {shop.name} ({shop.subdomain}) - หมดอายุ {new Date(shop.expire_date).toLocaleDateString("th-TH")}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-red-500 text-sm">ไม่พบร้านค้าที่สามารถต่ออายุได้</div>
                                )}
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2">
                                <AlertCircle className="h-5 w-5" />
                                ข้อมูลสำคัญ
                            </div>
                            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                                <li>ราคา: ฿{packagePrice.toFixed(2)}</li>
                                <li>อายุการใช้งาน: 30 วัน</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-600">ดำเนินการสำเร็จ!</h3>
                        <p className="text-gray-600">
                            {operationType === "new" ? "เว็บไซต์ของคุณพร้อมใช้งานแล้ว" : "ต่ออายุเว็บไซต์เรียบร้อยแล้ว"}
                        </p>
                        {operationType === "new" && (
                            <div className="bg-gray-100 p-4 rounded-lg text-left w-full max-w-xs mx-auto mt-4">
                                <p className="text-sm"><strong>Username:</strong> {username}</p>
                                <p className="text-sm"><strong>Password:</strong> {password}</p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {step === "form" ? (
                        <>
                            <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || (operationType === "renew" && !subdomain)}
                                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        กำลังดำเนินการ...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {operationType === "new" ? "ซื้อเว็บไซต์" : "ต่ออายุ"} (฿{packagePrice.toFixed(2)})
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
                            ตกลง
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
