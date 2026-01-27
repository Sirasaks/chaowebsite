"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CheckCircle, Loader2, XCircle, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { OrderTableSkeleton } from "@/components/shop/admin/OrderTableSkeleton";

interface Order {
    id: number;
    user_id: number;
    username: string;
    product_name: string;
    price: string;
    quantity: number;
    data: string; // JSON string
    created_at: string;
}

export default function ManualOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog States
    const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [completeOrder, setCompleteOrder] = useState<Order | null>(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/shop/admin/orders/manual");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusUpdate = async (id: number, status: 'completed' | 'cancelled', note?: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/shop/admin/orders/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, note }),
            });

            if (res.ok) {
                toast.success(status === 'completed' ? "ดำเนินการเรียบร้อย" : "ยกเลิกรายการเรียบร้อย");
                setOrders((prev) => prev.filter((o) => o.id !== id));
            } else {
                const error = await res.json();
                toast.error(error.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setProcessingId(null);
            setCancelOrder(null);
            setCompleteOrder(null);
            setCancelReason("");
        }
    };

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

    // URL Pagination
    const router = useRouter();
    const searchParams = useSearchParams();
    const pageParam = parseInt(searchParams.get("page") || "1");
    const [page, setPage] = useState(pageParam);
    const itemsPerPage = 10;

    useEffect(() => {
        const p = parseInt(searchParams.get("page") || "1");
        setPage(p);
    }, [searchParams]);

    useEffect(() => {
        if (!searchParams.has("page")) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", "1");
            router.replace(`?${params.toString()}`);
        }
    }, []);

    const updateUrl = (p: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", p.toString());
        router.push(`?${params.toString()}`);
    }

    const filteredOrders = orders.filter(order =>
        order.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
    const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            updateUrl(newPage);
        }
    };

    // Reset to page 1 on search
    useEffect(() => {
        if (searchTerm && page !== 1) {
            updateUrl(1);
        }
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">รายการรอดำเนินการ</h1>
                    <p className="text-muted-foreground">จัดการคำสั่งซื้อที่ต้องดำเนินการด้วยตนเอง</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="ค้นหา User, ID, สินค้า..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 bg-background"
                        />
                    </div>
                    <Badge variant="secondary" className="text-base px-3 py-1 h-10 flex items-center">
                        รอตรวจสอบ {filteredOrders.length}
                    </Badge>
                </div>
            </div>

            {loading ? (
                <OrderTableSkeleton />
            ) : (
                <div className="rounded-md border bg-card text-card-foreground">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">วันที่/เวลา</TableHead>
                                <TableHead>ผู้ใช้</TableHead>
                                <TableHead>สินค้า</TableHead>
                                <TableHead>ข้อมูลจากลูกค้า</TableHead>
                                <TableHead className="text-right">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <CheckCircle className="h-12 w-12 text-green-500/20" />
                                            <p>{searchTerm ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการที่ต้องดำเนินการ"}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="whitespace-nowrap align-top">
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
                                        <TableCell className="align-top bg-muted/30 rounded-md p-2 min-w-[200px]">
                                            {renderCustomerData(order.data)}
                                        </TableCell>
                                        <TableCell className="text-right align-top">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setCancelOrder(order)}
                                                    disabled={processingId === order.id}
                                                >
                                                    <XCircle className="h-4 w-4 md:mr-2" />
                                                    <span className="hidden md:inline">ยกเลิก</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => setCompleteOrder(order)}
                                                    disabled={processingId === order.id}
                                                >
                                                    <>
                                                        <CheckCircle className="h-4 w-4 md:mr-2" />
                                                        <span className="hidden md:inline">เสร็จสิ้น</span>
                                                    </>
                                                </Button>
                                            </div>
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

            {/* Cancel Dialog */}
            <Dialog open={!!cancelOrder} onOpenChange={(open) => !open && setCancelOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ยกเลิกรายการสั่งซื้อ</DialogTitle>
                        <DialogDescription>
                            คุณต้องการยกเลิกรายการของ {cancelOrder?.username} ใช่หรือไม่?
                            <br />
                            <span className="text-red-500 font-medium">ระบบจะคืนเงินให้ลูกค้าโดยอัตโนมัติ</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <label className="text-sm font-medium">ระบุสาเหตุที่ยกเลิก (ลูกค้าจะเห็นข้อความนี้)</label>
                        <Textarea
                            placeholder="เช่น ข้อมูลไม่ถูกต้อง, สินค้าหมดชั่วคราว"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelOrder(null)}>ปิด</Button>
                        <Button
                            variant="destructive"
                            onClick={() => cancelOrder && handleStatusUpdate(cancelOrder.id, 'cancelled', cancelReason)}
                            disabled={!cancelReason.trim()}
                        >
                            ยืนยันการยกเลิก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete Dialog */}
            <Dialog open={!!completeOrder} onOpenChange={(open) => !open && setCompleteOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ยืนยันการดำเนินการเสร็จสิ้น</DialogTitle>
                        <DialogDescription>
                            คุณตรวจสอบข้อมูลและดำเนินการให้ลูกค้าเรียบร้อยแล้วใช่หรือไม่?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/50 p-4 rounded-md text-sm">
                        <div className="font-medium mb-2">ข้อมูลลูกค้า:</div>
                        {completeOrder && renderCustomerData(completeOrder.data)}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompleteOrder(null)}>ยกเลิก</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => completeOrder && handleStatusUpdate(completeOrder.id, 'completed')}
                        >
                            ยืนยัน
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
