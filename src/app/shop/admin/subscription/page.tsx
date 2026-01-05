import { getShopIdFromContext } from "@/lib/shop-helper";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubscriptionTimer } from "./subscription-timer";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
    const shopId = await getShopIdFromContext();
    if (!shopId) return <div>Shop not found</div>;

    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT expire_date FROM shops WHERE id = ?",
        [shopId]
    );

    if (rows.length === 0) return <div>Shop data not found</div>;

    const expireDate = new Date(rows[0].expire_date);
    const formattedDate = expireDate.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const formattedTime = expireDate.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Determine year in BE (Buddhist Era)
    const year = expireDate.getFullYear() + 543;
    const formattedDateBE = `${expireDate.getDate()}/${expireDate.getMonth() + 1}/${year} ${formattedTime}`;

    return (
        <div className="flex items-center justify-center p-4 min-h-[80vh]">
            <Card className="w-full max-w-2xl border-none shadow-none bg-transparent">
                <CardContent className="flex flex-col items-center text-center p-0 gap-8">

                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        เว็บไซต์ ของคุณ จะหมดอายุในอีก
                    </h1>

                    <div className="py-2 w-full">
                        <SubscriptionTimer targetDate={expireDate} />
                    </div>

                    <div className="text-base md:text-lg text-gray-700">
                        หมดอายุวันที่ {formattedDateBE}
                    </div>

                    <div className="flex flex-row gap-4 pt-4">
                        <Button asChild className=" bg-primary hover:opacity-90 text-white min-w-[140px] h-12 text-lg rounded-lg shadow-sm">
                            <a href="https://chaoweb.site" target="_blank" rel="noopener noreferrer">
                                ต่ออายุเว็บไซต์
                            </a>
                        </Button>

                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
