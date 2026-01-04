"use client";

import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

interface ProductPriceProps {
    price: number;
    className?: string;
    textClassName?: string;
    allowDiscount?: boolean;
}

import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
    role?: string;
    agent_discount?: number;
}

export function ProductPrice({ price, className, textClassName, initialUser, allowDiscount = true }: ProductPriceProps & { initialUser?: UserData | null }) {
    const { user: clientUser, loading } = useAuth();

    // Check if initialUser was passed (server-side rendering)
    // If undefined, it means we don't have server data, so rely on client loading.
    // If null, it means server confirmed user is not logged in (Guest).
    // If object, it means server confirmed user is logged in.
    const isSSR = initialUser !== undefined;
    const isLoading = isSSR ? false : loading;
    const user = isSSR ? initialUser : clientUser;

    if (isLoading) {
        return <Skeleton className="h-6 w-24" />;
    }

    // Check if user is agent and has discount, and discount is allowed
    if (user && user.role === 'agent' && (user.agent_discount || 0) > 0 && allowDiscount) {
        const discountPercent = user.agent_discount || 0;
        const discountedPrice = price * (1 - discountPercent / 100);

        return (
            <div className={cn("flex flex-col items-start gap-1", className)}>
                <div className="flex items-center gap-2">
                    <span className={cn("font-medium text-gradient-primary", textClassName)}>฿{discountedPrice.toLocaleString()}</span>
                    <Badge variant="secondary" className="text-[10px] h-5 bg-purple-100 text-purple-700 px-1">
                        -{discountPercent}%
                    </Badge>
                </div>
                <span className="text-xs text-muted-foreground line-through">฿{price.toLocaleString()}</span>
            </div>
        );
    }

    return (
        <p className={cn("font-medium text-gradient-primary", textClassName)}>฿{price.toLocaleString()}</p>
    );
}
