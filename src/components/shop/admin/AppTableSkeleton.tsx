import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function AppTableSkeleton() {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[35%]">สินค้า</TableHead>
                        <TableHead className="text-center w-[12%]">คงเหลือ</TableHead>
                        <TableHead className="text-right w-[15%]">ต้นทุนจากเว็บ</TableHead>
                        <TableHead className="text-center w-[13%]">สถานะ</TableHead>
                        <TableHead className="text-right w-[25%]">ราคาขาย</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-4 w-8 mx-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-16 ml-auto" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="h-6 w-12 mx-auto rounded-full" />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-2">
                                    <Skeleton className="h-8 w-28" />
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
