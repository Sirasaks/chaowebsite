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
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface TopupRecord {
    id: number;
    username: string;
    trans_ref: string;
    amount: string; // DECIMAL returns as string
    sender_name: string;
    receiver_name: string;
    status: string;
    created_at: string;
}

export function TopupHistoryTable() {
    const [history, setHistory] = useState<TopupRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/admin/topup-history");
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.history || []);
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ประวัติการเติมเงินล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>วันที่/เวลา</TableHead>
                            <TableHead>ผู้ใช้</TableHead>
                            <TableHead>เลขที่อ้างอิง</TableHead>
                            <TableHead>ผู้โอน</TableHead>
                            <TableHead>จำนวนเงิน</TableHead>
                            <TableHead>สถานะ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    ไม่มีข้อมูลการเติมเงิน
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(record.created_at), "d MMM yyyy HH:mm", { locale: th })}
                                    </TableCell>
                                    <TableCell>{record.username}</TableCell>
                                    <TableCell className="font-mono text-xs">{record.trans_ref}</TableCell>
                                    <TableCell>{record.sender_name}</TableCell>
                                    <TableCell className="font-bold text-green-600">
                                        +{Number(record.amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                                            {record.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
