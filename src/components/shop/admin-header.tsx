"use client";

import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, Menu, User, Settings, LogOut, Wallet, LayoutDashboard, History, User as UserIcon, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function AdminHeader() {
    const { user } = useAuth();
    const pathname = usePathname();
    const paths = pathname.split("/").filter(Boolean);

    const logout = async () => {
        try {
            await fetch("/api/shop/auth/logout", { method: "POST" })
            // Force refresh to clear all states
            window.location.href = "/"
        } catch (err) {
            console.error(err)
        }
    }

    // Map path segments to readable names
    const pathNameMap: Record<string, string> = {
        admin: "Dashboard",
        home: "จัดการหน้าแรก",
        games: "บริการเติมเกม",
        prices: "ตั้งค่าราคา",
        categories: "หมวดหมู่",
        products: "สินค้า",
        accounts: "ไอดีเกม",
        forms: "ฟอร์มเติมเงิน",
        apps: "แอพพรีเมี่ยม",
        cards: "บัตรเติมเงิน",
        settings: "การตั้งค่า",
        slideshow: "ภาพสไลด์",
    };

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
                {/* Mobile Sidebar Trigger */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="lg:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
                        <SheetTitle className="hidden">Navigation Menu</SheetTitle>
                        <AdminSidebar />
                    </SheetContent>
                </Sheet>

                {/* Breadcrumbs */}
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        {paths.map((path, index) => {
                            const isLast = index === paths.length - 1;
                            const href = `/${paths.slice(0, index + 1).join("/")}`;
                            const label = pathNameMap[path] || path;

                            return (
                                <React.Fragment key={path}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </React.Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-4">


                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                </Button>

                {/* User Menu (Mobile/Desktop) */}
                {/* User Menu (Mobile/Desktop) */}
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarImage src="" alt={user.username} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="leading-none">{user.username}</p>
                                    <div className="flex items-center pt-1">
                                        <Wallet className="mr-2 h-4 w-4" />
                                        <p>เครดิต: {user.credit.toFixed(2)} บาท</p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <Link href="/admin"><LayoutDashboard className="text-black mr-2 h-4 w-4" />จัดการระบบ</Link>
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
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                )}
            </div>
        </header>
    );
}
