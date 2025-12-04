"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Loader2, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderTableSkeleton } from "@/components/shop/admin/OrderTableSkeleton";

interface Order {
    id: number;
    user_id: number;
    username: string;
    product_name: string;
    price: string;
    quantity: number;
    data: string;
    status: 'pending' | 'completed' | 'cancelled';
    note?: string;
    created_at: string;
}

export default function AdminOrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shop/admin/orders/history?search=${encodeURIComponent(searchTerm)}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchOrders();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const renderCustomerData = (dataStr: string) => {
        try {
            const data = JSON.parse(dataStr);
            return (
                <div className="text-sm space-y-1">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                            <span className="font-medium text-muted-foreground capitalize">{key}:</span>
                            <span className="font-mono">{String(value)}</span>
                        </div>
                    ))}
                </div>
            );
        } catch (e) {
            return <span className="text-muted-foreground italic">ไม่มีข้อมูล</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="success">สำเร็จ</Badge>;
            case 'cancelled':
                return <Badge variant="destructive-soft">ยกเลิก</Badge>;
            default:
                return <Badge variant="secondary">รอตรวจสอบ</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ประวัติคำสั่งซื้อ</h1>
                    <p className="text-muted-foreground">รายการคำสั่งซื้อทั้งหมดในระบบ</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหา User, ID, สินค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {loading ? (
                <OrderTableSkeleton />
            ) : (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[160px]">วันที่/เวลา</TableHead>
                                <TableHead>ผู้ใช้</TableHead>
                                <TableHead>สินค้า</TableHead>
                                <TableHead className="text-center">สถานะ</TableHead>
                                <TableHead className="text-right">ข้อมูล</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        ไม่พบข้อมูลคำสั่งซื้อ
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="whitespace-nowrap align-top text-sm">
                                            {format(new Date(order.created_at), "d MMM yyyy HH:mm", { locale: th })}
                                        </TableCell>
                                        <TableCell className="align-top font-medium">
                                            {order.username}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className="font-medium">{order.product_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                x{order.quantity} ({Number(order.price).toLocaleString()} ฿)
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {getStatusBadge(order.status)}
                                                {order.status === 'cancelled' && order.note && (
                                                    <span className="text-xs text-red-500 max-w-[150px] truncate" title={order.note}>
                                                        {order.note}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right align-top">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">ดูข้อมูล</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>รายละเอียดคำสั่งซื้อ #{order.id}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground">ผู้สั่งซื้อ:</span>
                                                                <div className="font-medium">{order.username}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">วันที่:</span>
                                                                <div className="font-medium">{format(new Date(order.created_at), "d MMM yyyy HH:mm", { locale: th })}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">สินค้า:</span>
                                                                <div className="font-medium">{order.product_name}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">ราคา:</span>
                                                                <div className="font-medium">{Number(order.price).toLocaleString()} ฿</div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-muted/50 p-4 rounded-md">
                                                            <div className="text-sm font-medium mb-2 text-muted-foreground">ข้อมูลจากลูกค้า:</div>
                                                            {renderCustomerData(order.data)}
                                                        </div>

                                                        {order.status === 'cancelled' && order.note && (
                                                            <div className="bg-red-50 p-4 rounded-md border border-red-100">
                                                                <div className="text-sm font-medium mb-1 text-red-600">สาเหตุที่ยกเลิก:</div>
                                                                <div className="text-sm text-red-600">{order.note}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
