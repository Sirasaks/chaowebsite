"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, Search, Copy, Check } from "lucide-react";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import DOMPurify from "isomorphic-dompurify";

interface Order {
    id: number;
    product_name: string;
    product_type: "account" | "form" | "api";
    product_image: string;
    price: string;
    quantity: number;
    data: string;
    status: "pending" | "api_pending" | "completed" | "failed" | "cancelled";
    created_at: string;
    note?: string;
}

function CopyButton({ text }: { text: string }) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
        >
            {isCopied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
            {isCopied ? "คัดลอกแล้ว" : "คัดลอก"}
        </Button>
    );
}

function HistoryContent() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();


    // Get page from URL or default to 1
    const currentPage = Number(searchParams.get("page")) || 1;
    const searchQuery = searchParams.get("search") || "";
    const [searchTerm, setSearchTerm] = useState(searchQuery);

    // Sync local state with URL (e.g. on back button)
    useEffect(() => {
        setSearchTerm(searchQuery);
    }, [searchQuery]);

    // Debounce search URL update
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            const currentSearch = params.get("search") || "";

            if (searchTerm !== currentSearch) {
                params.set("page", "1");
                if (searchTerm) {
                    params.set("search", searchTerm);
                } else {
                    params.delete("search");
                }
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, pathname, searchParams]);

    useEffect(() => {
        if (!searchParams.has("page")) {
            const params = new URLSearchParams(searchParams);
            params.set("page", "1");
            router.replace(`${pathname}?${params.toString()}`);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/shop/history?page=${currentPage}&limit=10&search=${encodeURIComponent(searchQuery)}`);

                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                const data = await res.json();
                if (data.orders) {
                    setOrders(data.orders);
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [router, currentPage, searchParams, pathname, searchQuery]);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
    };

    const getDisplayText = (order: Order) => {
        if (order.product_type === 'api') {
            try {
                const dataObj = JSON.parse(order.data);
                return dataObj.textdb || order.data;
            } catch (e) {
                return order.data;
            }
        }
        return order.data;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">หน้าแรก</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>ประวัติการสั่งซื้อ</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">ประวัติการสั่งซื้อ</h1>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาชื่อสินค้า..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-8 bg-card text-card-foreground"
                    />
                </div>
            </div>

            <div className="rounded-md border overflow-x-auto bg-card text-card-foreground">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] text-center">#</TableHead>
                            <TableHead className="min-w-[200px] md:w-[300px]">ชื่อสินค้า</TableHead>
                            <TableHead className="text-center">จำนวน</TableHead>
                            <TableHead className="text-center">ราคารวม</TableHead>
                            <TableHead className="text-center hidden md:table-cell">วัน - เวลา</TableHead>
                            <TableHead className="text-center">สถานะ</TableHead>
                            <TableHead className="text-right">ข้อมูล</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 w-8 bg-muted rounded animate-pulse mx-auto" /></TableCell>
                                    <TableCell><div className="h-10 w-10 rounded bg-muted animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-8 bg-muted rounded animate-pulse mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse mx-auto" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><div className="h-4 w-24 bg-muted rounded animate-pulse mx-auto" /></TableCell>
                                    <TableCell><div className="h-6 w-16 bg-muted rounded-full animate-pulse mx-auto" /></TableCell>
                                    <TableCell><div className="h-8 w-20 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    ไม่มีประวัติการสั่งซื้อ
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="text-center font-mono text-muted-foreground">
                                        #{order.id}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="relative h-8 w-8 md:h-10 md:w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                                                <img
                                                    src={order.product_image || "/placeholder.png"}
                                                    alt={order.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="truncate">{order.product_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{order.quantity}</TableCell>
                                    <TableCell className="text-center">฿{(Number(order.price) * order.quantity).toFixed(2)}</TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground hidden md:table-cell">
                                        {new Date(order.created_at).toLocaleString("th-TH")}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={
                                            order.status === "completed" ? "success" :
                                                order.status === "failed" ? "destructive-soft" :
                                                    order.status === "cancelled" ? "destructive-soft" :
                                                        order.status === "api_pending" ? "secondary" :
                                                            "secondary"
                                        }>
                                            {order.status === "completed" ? "สำเร็จ" :
                                                order.status === "api_pending" ? "กำลังประมวลผล" :
                                                    order.status === "failed" ? "ล้มเหลว (คืนเงินแล้ว)" :
                                                        order.status === "cancelled" ? "ยกเลิก" :
                                                            "รอดำเนินการ"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(order.product_type === "account" || order.product_type === "api") ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={order.status === "api_pending" || order.status === "failed"}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {order.status === "api_pending" ? "กำลังประมวลผล..." :
                                                            order.status === "failed" ? "ไม่มีข้อมูล" :
                                                                "ดูข้อมูล"}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <div className="flex items-center justify-between">
                                                            <DialogTitle>ข้อมูลสินค้า: {order.product_name}</DialogTitle>
                                                        </div>
                                                    </DialogHeader>
                                                    <div className="p-4 rounded-md border mt-4 bg-card text-card-foreground">
                                                        {order.product_type === 'api' ? (
                                                            <div
                                                                className="text-sm [&>h4]:font-bold [&>h4]:text-lg [&>h4]:mb-2 [&>p]:mb-2"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: DOMPurify.sanitize(getDisplayText(order))
                                                                }}
                                                            />
                                                        ) : (
                                                            <pre className="whitespace-pre-wrap font-mono text-sm">
                                                                {getDisplayText(order)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                    <CopyButton text={getDisplayText(order)} />
                                                </DialogContent>
                                            </Dialog>
                                        ) : (
                                            <div className="flex flex-col items-end gap-1">
                                                {order.status === "completed" && (
                                                    <span className="text-xs text-green-600 font-medium">
                                                        ดำเนินการเรียบร้อย
                                                    </span>
                                                )}
                                                {(order.status === "cancelled" || order.status === "failed") && order.note && (
                                                    <span className="text-xs text-red-500 font-medium">
                                                        {order.status === "cancelled" ? "เหตุผล: " : "ข้อผิดพลาด: "}{order.note}
                                                    </span>
                                                )}
                                                {/* For pending status, show nothing to avoid redundancy with status column */}
                                                {(order.status !== "completed" && order.status !== "cancelled" && order.status !== "failed") && (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div >
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    size="sm"
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1 || loading}
                >
                    ก่อนหน้า
                </Button>
                <div className="text-sm text-muted-foreground">
                    หน้า {currentPage} จาก {totalPages || 1}
                </div>
                <Button
                    size="sm"
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                >
                    ถัดไป
                </Button>
            </div>
        </div >
    );
}

export default function HistoryPage() {
    return (
        <Suspense fallback={null}>
            <HistoryContent />
        </Suspense>
    );
}
