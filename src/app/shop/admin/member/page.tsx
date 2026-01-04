"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Plus, Minus, UserCog, Trash2, RefreshCw, Users, Percent, Settings } from "lucide-react";

interface User {
    id: number;
    username: string;
    email: string;
    role: "user" | "agent" | "owner";
    credit: number;
    created_at: string;
    total_orders: number;
    total_spent: number;
    agent_discount: number;
}

export default function AdminMemberPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Credit Dialog
    const [creditDialogOpen, setCreditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [creditAmount, setCreditAmount] = useState("");
    const [creditType, setCreditType] = useState<"add" | "subtract">("add");
    const [creditNote, setCreditNote] = useState("");
    const [creditLoading, setCreditLoading] = useState(false);

    // Edit User Dialog (Role & Discount)
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editRole, setEditRole] = useState<"user" | "agent" | "owner">("user");
    const [editDiscount, setEditDiscount] = useState("0");
    const [editLoading, setEditLoading] = useState(false);

    // Delete Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (roleFilter !== "all") params.set("role", roleFilter);

            const res = await fetch(`/api/shop/admin/users?${params}`);
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            } else {
                toast.error(data.error || "ไม่สามารถโหลดข้อมูลได้");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers();
    };

    const openCreditDialog = (user: User, type: "add" | "subtract") => {
        setSelectedUser(user);
        setCreditType(type);
        setCreditAmount("");
        setCreditNote("");
        setCreditDialogOpen(true);
    };

    const handleCreditSubmit = async () => {
        if (!selectedUser || !creditAmount) return;

        setCreditLoading(true);
        try {
            const res = await fetch(`/api/shop/admin/users/${selectedUser.id}/credit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(creditAmount),
                    type: creditType,
                    note: creditNote || undefined,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setCreditDialogOpen(false);
                fetchUsers();
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setCreditLoading(false);
        }
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setEditRole(user.role);
        setEditDiscount(user.agent_discount?.toString() || "0");
        setEditDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        if (!selectedUser) return;

        setEditLoading(true);
        try {
            const res = await fetch(`/api/shop/admin/users/${selectedUser.id}/role`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: editRole,
                    agent_discount: parseFloat(editDiscount) || 0
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setEditDialogOpen(false);
                fetchUsers();
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setEditLoading(false);
        }
    };

    const openDeleteDialog = (user: User) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedUser) return;

        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/shop/admin/users/${selectedUser.id}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setDeleteDialogOpen(false);
                fetchUsers();
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setDeleteLoading(false);
        }
    };

    const getRoleBadge = (user: User) => {
        switch (user.role) {
            case "owner":
                return <Badge variant="default">เจ้าของร้าน</Badge>;
            case "agent":
                return (
                    <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">นายหน้า</Badge>
                        {user.agent_discount > 0 && (
                            <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">
                                -{user.agent_discount}%
                            </Badge>
                        )}
                    </div>
                );
            default:
                return <Badge variant="outline">ผู้ใช้ทั่วไป</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการสมาชิก</h1>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-2 max-w-sm w-full">
                    <div className="relative w-full">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="ค้นหา username หรือ email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                            className="pl-8"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="กรอง role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
                            <SelectItem value="agent">นายหน้า</SelectItem>
                            <SelectItem value="owner">เจ้าของร้าน</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchUsers} title="รีเฟรช">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">เครดิต</TableHead>
                            <TableHead className="text-center">สั่งซื้อ</TableHead>
                            <TableHead className="text-right">ยอดซื้อรวม</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-32" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-4 w-16 ml-auto" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-8 mx-auto" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-4 w-20 ml-auto" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    ไม่พบสมาชิก
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{getRoleBadge(user)}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        ฿{parseFloat(String(user.credit)).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">{user.total_orders}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        ฿{parseFloat(String(user.total_spent)).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="เพิ่มเครดิต"
                                                onClick={() => openCreditDialog(user, "add")}
                                            >
                                                <Plus className="h-4 w-4 text-green-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="หักเครดิต"
                                                onClick={() => openCreditDialog(user, "subtract")}
                                            >
                                                <Minus className="h-4 w-4 text-red-600" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="แก้ไขข้อมูล (Role/Discount)"
                                                onClick={() => openEditDialog(user)}
                                            >
                                                <UserCog className="h-4 w-4 text-purple-600" />
                                            </Button>

                                            {user.role !== "owner" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="ลบสมาชิก"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => openDeleteDialog(user)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Credit Dialog */}
            <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {creditType === "add" ? "เพิ่มเครดิต" : "หักเครดิต"} - {selectedUser?.username}
                        </DialogTitle>
                        <DialogDescription>
                            เครดิตปัจจุบัน: ฿{parseFloat(String(selectedUser?.credit || 0)).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>จำนวนเงิน</Label>
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>หมายเหตุ (ไม่บังคับ)</Label>
                            <Input
                                placeholder="เช่น โอนผิด, โบนัส, ฯลฯ"
                                value={creditNote}
                                onChange={(e) => setCreditNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleCreditSubmit}
                            disabled={creditLoading || !creditAmount}
                            className={creditType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            {creditLoading ? "กำลังดำเนินการ..." : creditType === "add" ? "เพิ่มเครดิต" : "หักเครดิต"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog (Role & Discount) */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลสมาชิก - {selectedUser?.username}</DialogTitle>
                        <DialogDescription>
                            จัดการ Role และส่วนลดพิเศษ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select value={editRole} onValueChange={(val: any) => setEditRole(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
                                    <SelectItem value="agent">นายหน้า (ได้รับส่วนลด)</SelectItem>
                                    <SelectItem value="owner">เจ้าของร้าน (สิทธิ์สูงสุด)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {editRole === "agent" && (
                            <div className="grid gap-2">
                                <Label>ส่วนลดนายหน้า (%)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={editDiscount}
                                        onChange={(e) => setEditDiscount(e.target.value)}
                                    />
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    ส่วนลดนี้จะใช้กับสินค้าทุกชิ้นสำหรับผู้ใช้นี้
                                </p>
                            </div>
                        )}

                        {editRole === "owner" && (
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                <p className="text-sm text-yellow-800">
                                    <strong>คำเตือน:</strong> เจ้าของร้านมีสิทธิ์เข้าถึงข้อมูลทั้งหมด รวมถึงระบบจัดการ
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleEditSubmit} disabled={editLoading}>
                            {editLoading ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ลบสมาชิก</DialogTitle>
                        <DialogDescription>
                            คุณต้องการลบ <strong>{selectedUser?.username}</strong> หรือไม่?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-red-600">
                            การลบสมาชิกจะทำให้ผู้ใช้ไม่สามารถเข้าสู่ระบบได้อีก แต่ข้อมูลจะยังคงอยู่ในระบบ
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? "กำลังลบ..." : "ยืนยันลบ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
