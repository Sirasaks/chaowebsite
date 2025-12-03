"use client";

import { useEffect, useState } from "react";

export function useGradientColors() {
    const [colors, setColors] = useState({ primary: "#ea580c", secondary: "#8b5cf6" });

    useEffect(() => {
        const fetchColors = async () => {
            try {
                const res = await fetch("/api/settings");
                if (res.ok) {
                    const data = await res.json();
                    setColors({
                        primary: data.primary_color || "#ea580c",
                        secondary: data.secondary_color || "#8b5cf6"
                    });
                }
            } catch (error) {
                console.error("Failed to fetch gradient colors:", error);
            }
        };
        fetchColors();
    }, []);

    return colors;
}

export function getGradientStyle(primary: string, secondary: string) {
    return {
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    };
}
