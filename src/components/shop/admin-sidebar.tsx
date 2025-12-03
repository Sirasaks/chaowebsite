"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Gamepad2,
    DollarSign,
    Grid,
    CreditCard,
    Smartphone,
    Gift,
    Settings,
    FileText,
    ChevronDown,
    ChevronRight,
    Image as ImageIcon,
    User,
    Home,
    LogOut,
    MoreVertical,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    isActive?: boolean;
}

function SidebarItem({ icon: Icon, label, href, isActive }: SidebarItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                    ? "bg-gradient-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground")} />
            {label}
        </Link>
    );
}

interface SidebarCollapseProps {
    icon: React.ElementType;
    label: string;
    isActive?: boolean;
    children: React.ReactNode;
}

function SidebarCollapse({ icon: Icon, label, isActive, children }: SidebarCollapseProps) {
    const [isOpen, setIsOpen] = useState(isActive);

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                        ? "bg-accent/50 text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
            >
                <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground")} />
                    {label}
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />}
            </button>
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="pl-4 space-y-1 pt-1 border-l-2 border-muted ml-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface SidebarGroupProps {
    title: string;
    children: React.ReactNode;
}

function SidebarGroup({ title, children }: SidebarGroupProps) {
    return (
        <div className="mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {title}
            </h3>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-72 h-full bg-card border-r border-border flex flex-col shadow-sm">
            {/* Header / Logo */}
            <div className="h-16 flex items-center px-6 border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h1 className="text-xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">

                <SidebarGroup title="ภาพรวม">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        href="/admin"
                        isActive={pathname === "/admin"}
                    />
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="จัดการหน้าแรก"
                        href="/admin/home"
                        isActive={pathname === "/admin/home"}
                    />
                </SidebarGroup>

                <SidebarGroup title="คำสั่งซื้อ">
                    <SidebarCollapse
                        icon={FileText}
                        label="คำสั่งซื้อ"
                        isActive={pathname.startsWith("/admin/orders")}
                    >
                        <SidebarItem
                            icon={FileText}
                            label="รายการคำสั่งซื้อ"
                            href="/admin/orders/manual"
                            isActive={pathname === "/admin/orders/manual"}
                        />
                        <SidebarItem
                            icon={Clock}
                            label="ประวัติคำสั่งซื้อ"
                            href="/admin/orders/history"
                            isActive={pathname === "/admin/orders/history"}
                        />
                    </SidebarCollapse>
                </SidebarGroup>

                <SidebarGroup title="สินค้าอื่นๆ">
                    <SidebarItem
                        icon={CreditCard}
                        label="จัดการสินค้า (ไอดีเกม)"
                        href="/admin/products/accounts"
                        isActive={pathname.startsWith("/admin/products/accounts")}
                    />
                    <SidebarItem
                        icon={FileText}
                        label="จัดการสินค้า (Form/เติมเงิน)"
                        href="/admin/products/forms"
                        isActive={pathname.startsWith("/admin/products/forms")}
                    />
                    <SidebarItem
                        icon={Grid}
                        label="จัดการหมวดหมู่สินค้า"
                        href="/admin/products/categories"
                        isActive={pathname.startsWith("/admin/products/categories")}
                    />
                    <SidebarItem
                        icon={Smartphone}
                        label="แอพพรีเมี่ยม"
                        href="/admin/products/apps"
                        isActive={pathname.startsWith("/admin/products/apps")}
                    />

                </SidebarGroup>

                <SidebarGroup title="การตั้งค่า">
                    <SidebarCollapse
                        icon={Settings}
                        label="ตั้งค่าเว็บไซต์"
                        isActive={pathname.startsWith("/admin/settings")}
                    >
                        <SidebarItem
                            icon={ImageIcon}
                            label="ภาพสไลด์"
                            href="/admin/settings/slideshow"
                            isActive={pathname === "/admin/settings/slideshow"}
                        />
                        <SidebarItem
                            icon={FileText}
                            label="รายละเอียดเว็บไซต์"
                            href="/admin/settings"
                            isActive={pathname === "/admin/settings"}
                        />
                        <SidebarItem
                            icon={Settings}
                            label="ตั้งค่า API"
                            href="/admin/settings/api"
                            isActive={pathname === "/admin/settings/api"}
                        />
                        <SidebarItem
                            icon={CreditCard}
                            label="ตั้งค่าการชำระเงิน"
                            href="/admin/settings/payment"
                            isActive={pathname === "/admin/settings/payment"}
                        />
                        <SidebarItem
                            icon={Gamepad2}
                            label="จัดการปุ่มทางลัด"
                            href="/admin/settings/quicklink"
                            isActive={pathname === "/admin/settings/quicklink"}
                        />
                    </SidebarCollapse>
                </SidebarGroup>

            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-gradient-primary hover:text-white transition-all duration-200 font-medium"
                >
                    <Home className="h-4 w-4" />
                    กลับไปหน้าหลัก
                </Link>
            </div>
        </div>
    );
}
