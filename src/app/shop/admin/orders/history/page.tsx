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
    product_id: number;
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

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shop/admin/orders/history?page=${page}&limit=10&search=${encodeURIComponent(searchTerm)}`);
            if (res.ok) {
                const data = await res.json();
                // Handle new API format
                if (data.pagination) {
                    setOrders(data.data);
                    setTotalPages(data.pagination.totalPages);
                    setTotalItems(data.pagination.totalItems);
                } else {
                    // Fallback for old API if cached or mismatch
                    setOrders(data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    // Debounce search (Reset to page 1 on search)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPage(1); // Reset page on new search
            fetchOrders();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Fetch on page change (skip initial mount if handled by above effect, but simpler to just split effects or allow double fetch safely)
    // Actually, better to have one effect for query params.
    useEffect(() => {
        fetchOrders();
    }, [page]);

    // Note: The above might cause double fetch on search change because setSearch triggers setPage(1). 
    // Optimization: separate search effect to just setPage(1), and have page/search dependency on fetch effect.
    // Refactored Effect Logic:

    /* 
       Refactored logic to avoid double fetch:
       1. useEffect[searchTerm] -> sets page=1.
       2. useEffect[page, searchTerm] -> fetches. 
       But if searchTerm changes, page sets to 1. If page was already 1, user effect runs once. If page was 2, it changes to 1, effect runs.
       The issue is if page is already 1, setPage(1) doesn't trigger re-render, so we need to fetch manually or add searchTerm to dependency.
    */

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

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ประวัติคำสั่งซื้อ</h1>
                    <p className="text-muted-foreground">รายการคำสั่งซื้อทั้งหมดในระบบ ({totalItems} รายการ)</p>
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
                <div className="rounded-md border bg-card text-card-foreground">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">#</TableHead>
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
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        ไม่พบข้อมูลคำสั่งซื้อ
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium align-top">
                                            #{order.id}
                                        </TableCell>
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

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                    >
                        ก่อนหน้า
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        หน้า {page} จาก {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        ถัดไป
                    </Button>
                </div>
            )}
        </div>
    );
}
