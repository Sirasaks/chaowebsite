"use client"

import Link from "next/link"
import { Button } from "../../components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "../../components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogIn, UserPlus, Home, ShoppingBag, CircleDollarSign, Mail, LogOut, User as UserIcon, Settings, History, Wallet, Loader2, Menu, PhoneIcon, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface NavbarProps {
    logo?: string;
    title?: string;
}

export default function Navbar({ logo, title }: NavbarProps) {
    const { user, setUser, loading, error } = useAuth()
    const pathname = usePathname()
    const [contactLink, setContactLink] = useState<string | null>(null)

    // Fetch contact link from settings
    useEffect(() => {
        const fetchContactLink = async () => {
            try {
                const res = await fetch("/api/shop/settings")
                if (res.ok) {
                    const data = await res.json()
                    setContactLink(data.contact_link || null)
                }
            } catch (err) {
                console.error("Failed to fetch contact link:", err)
            }
        }
        fetchContactLink()
    }, [])

    // Don't show navbar on admin pages
    if (pathname?.startsWith("/admin")) {
        return null
    }

    // สามารถใช้ error state เพื่อแสดง UI บางอย่างได้หากต้องการ
    if (error) {
        console.error("Auth Error:", error)
    }

    const logout = async () => {
        try {
            await fetch("/api/shop/auth/logout", { method: "POST" })
            // Force refresh to clear all states
            window.location.href = "/login"
        } catch (err) {
            console.error(err)
        }
    }
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white p-2 text-foreground">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-12">

                    {/* Left — Logo + Desktop Menu */}
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="font-bold text-2xl flex items-center gap-2">
                            {logo ? (
                                <img src={logo} alt={title || "Logo"} className="h-8 w-auto object-contain" />
                            ) : (
                                <span>{title || "My Shop"}</span>
                            )}
                        </Link>
                        <div className="hidden md:flex items-center space-x-1">
                            <Link href="/"><Button variant="ghost" className={pathname === "/" ? "bg-gradient-primary text-white hover:text-white" : ""}><Home className="mr-2 h-4 w-4" />หน้าแรก</Button></Link>
                            <Link href="/categories"><Button variant="ghost" className={pathname === "/categories" ? "bg-gradient-primary text-white hover:text-white" : ""}><ShoppingBag className="mr-2 h-4 w-4" />สินค้าทั้งหมด</Button></Link>
                            <Link href="/topup"><Button variant="ghost" className={pathname?.startsWith("/topup") ? "bg-gradient-primary text-white hover:text-white" : ""}><Wallet className="mr-2 h-4 w-4" />เติมเงิน</Button></Link>
                            {contactLink ? (
                                <a href={contactLink} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost"><PhoneIcon className="mr-2 h-4 w-4" />ติดต่อเรา</Button>
                                </a>
                            ) : (
                                <Link href="/contact"><Button variant="ghost" className={pathname === "/contact" ? "bg-gradient-primary text-white hover:text-white" : ""}><PhoneIcon className="mr-2 h-4 w-4" />ติดต่อเรา</Button></Link>
                            )}
                        </div>
                    </div>

                    {/* Right — Mobile Menu + Avatar */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Hamburger Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden" suppressHydrationWarning>
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>เมนู</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/" className="cursor-pointer">
                                        <Home className="mr-2 h-4 w-4" />หน้าแรก
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/categories" className="cursor-pointer">
                                        <ShoppingBag className="mr-2 h-4 w-4" />สินค้าทั้งหมด
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/topup" className="cursor-pointer">
                                        <CircleDollarSign className="mr-2 h-4 w-4" />เติมเงิน
                                    </Link>
                                </DropdownMenuItem>
                                {contactLink ? (
                                    <DropdownMenuItem asChild>
                                        <a href={contactLink} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                            <Mail className="mr-2 h-4 w-4" />ติดต่อเรา
                                        </a>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem asChild>
                                        <Link href="/contact" className="cursor-pointer">
                                            <Mail className="mr-2 h-4 w-4" />ติดต่อเรา
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Desktop Auth Buttons / Avatar */}
                        <div className="hidden md:flex items-center gap-4">
                            {loading ? (
                                <div className="h-10 w-10 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0" suppressHydrationWarning>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src="" alt={user.username} />
                                                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-56 p-2">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="leading-none">{user.username}</p>
                                                <div className="flex items-center mt-1 px-3 py-1.5 rounded-full bg-gradient-primary text-white w-fit shadow-sm">
                                                    <Wallet className="mr-2 h-4 w-4" />
                                                    <p className="text-xs font-medium">เครดิต: {Number(user.credit).toFixed(2)} บาท</p>
                                                </div>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        {user.role === 'owner' && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/home"><LayoutDashboard className="text-black mr-2 h-4 w-4" />จัดการระบบ</Link>
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuItem asChild>
                                            <Link href="/profile"><UserIcon className="text-black mr-2 h-4 w-4" />โปรไฟล์</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link href="/history"><History className="text-black mr-2 h-4 w-4" />ประวัติสั่งซื้อ</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link href="/topup-history"><History className="text-black mr-2 h-4 w-4" />ประวัติสั่งเติมเงิน</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link href="/settings"><Settings className="text-black mr-2 h-4 w-4" />ตั้งค่า</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem onClick={logout} className="cursor-pointer">
                                            <LogOut className=" text-black mr-2 h-4 w-4" />
                                            ออกจากระบบ
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Button asChild variant="outline">
                                        <Link href="/login"><LogIn className="mr-2 h-4 w-4" />เข้าสู่ระบบ</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href="/register"><UserPlus className="mr-2 h-4 w-4" />สมัครสมาชิก</Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Avatar */}
                        <div className="md:hidden">
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src="" alt={user.username} />
                                                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-56 p-2">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="leading-none">{user.username}</p>
                                                <div className="flex items-center mt-1 px-3 py-1.5 rounded-full bg-gradient-primary text-white w-fit shadow-sm">
                                                    <Wallet className="mr-2 h-3.5 w-3.5" />
                                                    <p className="text-xs font-medium">เครดิต: {Number(user.credit).toFixed(2)} บาท</p>
                                                </div>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        {user.role === 'owner' && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/home"><LayoutDashboard className="text-black mr-2 h-4 w-4" />จัดการระบบ</Link>
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuItem asChild>
                                            <Link href="/profile"><UserIcon className="text-black mr-2 h-4 w-4" />โปรไฟล์</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link href="/history"><History className="text-black mr-2 h-4 w-4" />ประวัติสั่งซื้อ</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link href="/topup-history"><History className="text-black mr-2 h-4 w-4" />ประวัติสั่งเติมเงิน</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link href="/settings"><Settings className="text-black mr-2 h-4 w-4" />ตั้งค่า</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem onClick={logout} className="cursor-pointer">
                                            <LogOut className=" text-black mr-2 h-4 w-4" />
                                            ออกจากระบบ
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/login"><LogIn className="h-4 w-4" /></Link>
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link href="/register"><UserPlus className="h-4 w-4" /></Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </nav>
    )
}
