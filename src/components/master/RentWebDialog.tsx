"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, CreditCard, Check, Info } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RentWebDialogProps {
    isOpen: boolean
    onClose: () => void
    packagePrice: number
    packageName: string
    userCredit: number
}

const NEW_STEPS = [
    { id: 1, text: "กำลังตรวจสอบเครดิต...", delay: 600 },
    { id: 2, text: "กำลังสร้างเว็บไซต์...", delay: 1500 },
    { id: 3, text: "กำลังตั้งค่าโดเมน...", delay: 1000 },
    { id: 4, text: "กำลังติดตั้งระบบจัดการร้านค้า...", delay: 1200 },
    { id: 5, text: "กำลังสร้างบัญชีผู้ดูแลระบบ...", delay: 800 },
    { id: 6, text: "เว็บไซต์พร้อมใช้งาน!", delay: 500 },
]

const RENEW_STEPS = [
    { id: 1, text: "กำลังตรวจสอบเครดิต...", delay: 600 },
    { id: 2, text: "กำลังตรวจสอบข้อมูลเว็บไซต์...", delay: 800 },
    { id: 3, text: "กำลังต่ออายุเว็บไซต์...", delay: 1000 },
    { id: 4, text: "กำลังอัปเดตวันหมดอายุ...", delay: 800 },
    { id: 5, text: "ต่ออายุสำเร็จ!", delay: 500 },
]

export function RentWebDialog({ isOpen, onClose, packagePrice, packageName, userCredit }: RentWebDialogProps) {
    const [step, setStep] = useState<"form" | "processing">("form")
    const [loading, setLoading] = useState(false)
    const [shopName, setShopName] = useState("")
    const [subdomain, setSubdomain] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [operationType, setOperationType] = useState<"new" | "renew">("new")
    const [myShops, setMyShops] = useState<any[]>([])
    const [currentProcessingStep, setCurrentProcessingStep] = useState(0)
    const [redirecting, setRedirecting] = useState(false)
    const router = useRouter()

    // Fetch shops when dialog opens or switch to Renew
    useEffect(() => {
        if (isOpen) {
            fetch("/api/master/history")
                .then(res => res.json())
                .then(data => {
                    if (data.shops) setMyShops(data.shops)
                })
                .catch(err => console.error(err))
        }
    }, [isOpen])

    // Animate processing steps
    const currentSteps = operationType === "new" ? NEW_STEPS : RENEW_STEPS

    useEffect(() => {
        if (step === "processing" && currentProcessingStep < currentSteps.length) {
            const timer = setTimeout(() => {
                setCurrentProcessingStep(prev => prev + 1)
            }, currentSteps[currentProcessingStep]?.delay || 500)
            return () => clearTimeout(timer)
        } else if (step === "processing" && currentProcessingStep >= currentSteps.length) {
            // All steps complete, show redirect message then navigate
            setRedirecting(true)
            const timer = setTimeout(() => {
                toast.success(operationType === "new" ? "สร้างเว็บไซต์สำเร็จ!" : "ต่ออายุสำเร็จ!")
                window.location.href = "/history"
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [step, currentProcessingStep, operationType, currentSteps])

    const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setShopName(val)
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

        // Start processing animation
        setStep("processing")
        setCurrentProcessingStep(0)
        setRedirecting(false)

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

            if (!res.ok) {
                setStep("form")
                toast.error(data.error || "เกิดข้อผิดพลาด")
            }
            // If successful, the animation will continue and transition to success
        } catch (error) {
            console.error("Rent error:", error)
            setStep("form")
            toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
        }
    }

    const handleClose = () => {
        if (step !== "processing") {
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
                                        <span className="text-sm font-bold text-gray-500">.chaoweb.site</span>
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
                                        autoComplete="off"
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
                                        autoComplete="new-password"
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
                ) : step === "processing" ? (
                    <div className="py-8 px-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
                            {/* Header */}
                            <div className="flex items-center gap-2 text-green-700 font-semibold text-lg mb-4">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>
                                    {operationType === "new"
                                        ? `กำลังสร้างเว็บไซต์: ${subdomain}.chaoweb.site`
                                        : `กำลังต่ออายุ: ${subdomain}.chaoweb.site`
                                    }
                                </span>
                            </div>

                            {/* Progress Steps */}
                            {currentSteps.map((s, index) => (
                                <div
                                    key={s.id}
                                    className={`flex items-center gap-3 transition-all duration-300 ${index < currentProcessingStep
                                        ? "opacity-100"
                                        : "opacity-0 h-0 overflow-hidden"
                                        }`}
                                >
                                    <Check className="h-5 w-5 text-green-600 shrink-0" />
                                    <span className="text-green-700">{s.text}</span>
                                </div>
                            ))}

                            {/* Redirect message */}
                            {redirecting && (
                                <div className="flex items-center gap-3 text-blue-600 animate-pulse mt-4">
                                    <Info className="h-5 w-5 shrink-0" />
                                    <span>กำลังนำคุณไปที่หน้าโปรไฟล์...</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

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
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
