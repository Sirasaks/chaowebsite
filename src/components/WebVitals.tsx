"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
    useReportWebVitals((metric) => {
        // In production, you would send this to your analytics service
        // For now, we'll log it to console in development
        if (process.env.NODE_ENV === "development") {
            console.log(metric);
        }
    });

    return null;
}
