import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Column {
    header: string;
    width?: string;
    skeletonWidth?: string;
    center?: boolean;
}

interface HomeTableSkeletonProps {
    columns?: Column[];
    rows?: number;
}

const defaultColumns: Column[] = [
    { header: "Order", width: "w-[80px]", skeletonWidth: "w-4", center: true },
    { header: "Image", skeletonWidth: "w-10 h-10 rounded-md" },
    { header: "Name", skeletonWidth: "w-48" },
    { header: "Price", skeletonWidth: "w-16" },
];

export function HomeTableSkeleton({ columns = defaultColumns, rows = 5 }: HomeTableSkeletonProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col, i) => (
                            <TableHead key={i} className={col.width}>{col.header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(rows)].map((_, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {columns.map((col, colIndex) => (
                                <TableCell key={colIndex} className={col.center ? "text-center" : ""}>
                                    <Skeleton className={`h-4 ${col.skeletonWidth || "w-20"} ${col.center ? "mx-auto" : ""}`} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
