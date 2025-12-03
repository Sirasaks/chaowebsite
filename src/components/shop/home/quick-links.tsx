"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface QuickLink {
    id: number;
    title: string;
    image_url: string;
    link_url: string;
    is_external: boolean;
    display_order: number;
}

interface QuickLinksProps {
    links: QuickLink[];
}

export function QuickLinks({ links }: QuickLinksProps) {

    if (links.length === 0) return null;

    return (
        <section className="py-2 pb-2">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {links.map((link) => (
                        <Link
                            key={link.id}
                            href={link.link_url}
                            target={link.is_external ? "_blank" : undefined}
                            rel={link.is_external ? "noopener noreferrer" : undefined}
                            className="group relative overflow-hidden rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg block"
                        >
                            <div className="aspect-2/1 w-full relative">
                                <img
                                    src={link.image_url}
                                    alt={link.title}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
