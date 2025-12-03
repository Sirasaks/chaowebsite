import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function ProductTableSkeleton() {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>รูปภาพ</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead className="text-right">ราคา</TableHead>
                        <TableHead className="text-center">สต็อก</TableHead>
                        <TableHead className="text-center">สถานะ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Skeleton className="h-10 w-10 rounded" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-40" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-16 ml-auto" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-6 w-12 mx-auto rounded-full" />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
