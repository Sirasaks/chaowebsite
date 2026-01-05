"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function SubscriptionTimer({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = targetDate.getTime() - new Date().getTime();

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000)
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) {
        return <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />;
    }

    return (
        <div className="flex justify-center items-center gap-8 md:gap-12 w-full text-center">
            <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-bold text-primary">{timeLeft.days}</span>
                <span className="text-sm text-gray-500 mt-2">วัน</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-bold text-primary">{timeLeft.hours}</span>
                <span className="text-sm text-gray-500 mt-2">ชั่วโมง</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-bold text-primary">{timeLeft.minutes}</span>
                <span className="text-sm text-gray-500 mt-2">นาที</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-bold text-primary">{timeLeft.seconds}</span>
                <span className="text-sm text-gray-500 mt-2">วินาที</span>
            </div>
        </div>
    );
}
