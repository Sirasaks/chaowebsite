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
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Loader2, Search } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

interface TopupTransaction {
    id: number;
    trans_ref: string;
    amount: string;
    status: string;
    created_at: string;
}

function TopupHistoryContent() {
    const [history, setHistory] = useState<TopupTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentPage = Number(searchParams.get("page")) || 1;
    const searchQuery = searchParams.get("search") || "";
    const [searchTerm, setSearchTerm] = useState(searchQuery);

    // Sync local state with URL
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
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/shop/topup/history?page=${currentPage}&limit=10&search=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.data);
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [currentPage, searchQuery]);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
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
                        <BreadcrumbPage>ประวัติการเติมเงิน</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">ประวัติการเติมเงิน</h1>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาเลขที่รายการ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[150px]">วันที่/เวลา</TableHead>
                            <TableHead className="min-w-[150px]">เลขที่รายการ</TableHead>
                            <TableHead className="text-center">จำนวนเงิน</TableHead>
                            <TableHead className="text-center">สถานะ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    ไม่พบประวัติการเติมเงิน
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {format(new Date(item.created_at), "d MMM yyyy HH:mm", { locale: th })}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {item.trans_ref}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-green-600">
                                        +{parseFloat(item.amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={
                                            item.status === 'completed' ? 'success' :
                                                item.status === 'failed' ? 'destructive-soft' :
                                                    item.status === 'cancelled' ? 'destructive-soft' :
                                                        'secondary'
                                        }>
                                            {item.status === 'completed' ? 'สำเร็จ' :
                                                item.status === 'failed' ? 'ล้มเหลว' :
                                                    item.status === 'cancelled' ? 'ยกเลิก' :
                                                        item.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
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
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                >
                    ถัดไป
                </Button>
            </div>
        </div>
    );
}

export default function TopupHistoryPage() {
    return (
        <Suspense fallback={null}>
            <TopupHistoryContent />
        </Suspense>
    );
}
