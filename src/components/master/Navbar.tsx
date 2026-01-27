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

export function MasterNavbar({ logo, title }: NavbarProps) {
    const { user, setUser, loading, error } = useAuth()
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    // const [contactLink, setContactLink] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Fetch contact link from settings (Master might not have settings yet)
    // useEffect(() => {
    //     const fetchContactLink = async () => {
    //         try {
    //             const res = await fetch("/api/master/settings")
    //             if (res.ok) {
    //                 const data = await res.json()
    //                 setContactLink(data.contact_link || null)
    //             }
    //         } catch (err) {
    //             console.error("Failed to fetch contact link:", err)
    //         }
    //     }
    //     fetchContactLink()
    // }, [])

    // Don't show navbar on admin pages (if master has admin pages)
    // if (pathname?.startsWith("/master/admin")) {
    //     return null
    // }

    if (error) {
        console.error("Auth Error:", error)
    }

    const logout = async () => {
        try {
            await fetch("/api/master/auth/logout", { method: "POST" })
            // Force refresh to clear all states
            window.location.href = "/login"
        } catch (err) {
            console.error(err)
        }
    }

    // Helper function to render auth content only after mount
    const renderAuthContent = () => {
        if (!mounted || loading) {
            return (
                <div className="h-10 w-10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )
        }
        return null
    }
    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b  p-3">
            <div className="container mx-auto flex justify-between items-center max-w-7xl px-4">

                {/* Left — Logo + Desktop Menu */}
                <div className="flex items-center space-x-8">
                    <Link href="/" className="flex items-center space-x-2">
                        {logo ? (
                            <img src={logo} alt={title || "Logo"} className="h-10 w-10 object-contain" />
                        ) : (
                            <img src="/vercel.svg" alt="ChaoWeb" className="h-10 w-10 object-contain" />
                        )}
                    </Link>
                    <ul className="hidden md:flex items-center space-x-1">
                        <li>
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-transparent">
                                    <Home className="mr-1.5 h-4 w-4" />หน้าแรก
                                </Button>
                            </Link>
                        </li>
                        <li>
                            <Link href="/topup">
                                <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-transparent">
                                    <Wallet className="mr-1.5 h-4 w-4" />เติมเงิน
                                </Button>
                            </Link>
                        </li>
                        <li>
                            <Link href="/shop">
                                <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-transparent">
                                    <ShoppingBag className="mr-1.5 h-4 w-4" />เช่าเว็บไซต์
                                </Button>
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact">
                                <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-transparent">
                                    <PhoneIcon className="mr-1.5 h-4 w-4" />ติดต่อเรา
                                </Button>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Right — Mobile Menu + Avatar */}
                <div className="flex items-center gap-2">
                    {/* Mobile Hamburger Menu */}
                    {mounted && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
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
                                    <Link href="/topup" className="cursor-pointer">
                                        <Wallet className="mr-2 h-4 w-4" />เติมเงิน
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/shop" className="cursor-pointer">
                                        <ShoppingBag className="mr-2 h-4 w-4" />เช่าเว็บไซต์
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/contact" className="cursor-pointer">
                                        <Mail className="mr-2 h-4 w-4" />ติดต่อเรา
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Desktop Auth Buttons / Avatar */}
                    <div className="hidden md:flex items-center gap-4">
                        {(!mounted || loading) ? (
                            <div className="h-10 w-10 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src="" alt={user.username} />
                                            <AvatarFallback className="bg-primary text-white font-semibold">
                                                {user.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-56 p-2">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="leading-none">{user.username}</p>
                                            <div className="flex items-center mt-1 px-3 py-1.5 rounded-full bg-primary text-white w-fit shadow-sm">
                                                <Wallet className="mr-2 h-4 w-4" />
                                                <p className="text-xs font-medium">เครดิต: {Number(user.credit).toFixed(2)} บาท</p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem asChild>
                                        <Link href="/"><LayoutDashboard className="text-black mr-2 h-4 w-4" />Dashboard</Link>
                                    </DropdownMenuItem>

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
                                    <Link href="/login"><LogIn className="mr-2 h-4 w-4" />เริ่มต้นใช้งาน</Link>
                                </Button>
                                <Button asChild className="bg-primary hover:bg-primary/80">
                                    <Link href="/register"><UserPlus className="mr-2 h-4 w-4" />สมัครสมาชิก</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Avatar */}
                    <div className="md:hidden">
                        {(!mounted || loading) ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src="" alt={user.username} />
                                            <AvatarFallback className="bg-primary text-white font-semibold">
                                                {user.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-56 p-2">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="leading-none">{user.username}</p>
                                            <div className="flex items-center mt-1 px-3 py-1.5 rounded-full bg-blue-600 text-white w-fit shadow-sm">
                                                <Wallet className="mr-2 h-3.5 w-3.5" />
                                                <p className="text-xs font-medium">เครดิต: {Number(user.credit).toFixed(2)} บาท</p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem asChild>
                                        <Link href="/"><LayoutDashboard className="text-black mr-2 h-4 w-4" />Dashboard</Link>
                                    </DropdownMenuItem>

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
                                <Button asChild size="sm" className="bg-primary hover:bg-primary/80">
                                    <Link href="/register"><UserPlus className="h-4 w-4" /></Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
