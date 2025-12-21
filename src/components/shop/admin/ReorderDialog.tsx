"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface ReorderItem {
    id: number;
    name: string;
    image?: string;
    display_order?: number;
    [key: string]: any;
}

interface ReorderDialogProps {
    title: string;
    items: ReorderItem[];
    onSave: (items: ReorderItem[]) => Promise<void>;
    trigger: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ReorderDialog({ title, items, onSave, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ReorderDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

    const [orderedItems, setOrderedItems] = useState<ReorderItem[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setOrderedItems(
                [...items].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            );
        }
    }, [open, items]);

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newItems = [...orderedItems];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        setOrderedItems(newItems);
    };

    const moveDown = (index: number) => {
        if (index === orderedItems.length - 1) return;
        const newItems = [...orderedItems];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setOrderedItems(newItems);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedItems = orderedItems.map((item, index) => ({
                ...item,
                display_order: index
            }));
            await onSave(updatedItems);
            setOpen(false);
            toast.success("บันทึกการจัดเรียงเรียบร้อยแล้ว");
        } catch (error) {
            console.error("Failed to save order:", error);
            toast.error("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 border rounded-md bg-slate-50">
                    {orderedItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-white border rounded shadow-sm">
                            <div className="text-slate-400">
                                <GripVertical className="h-4 w-4" />
                            </div>

                            {item.image ? (
                                <div className="relative w-8 h-8 rounded overflow-hidden bg-slate-200 shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 shrink-0">No Img</div>
                            )}

                            <span className="text-sm font-medium flex-1">{item.name}</span>

                            <div className="flex items-center gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 hover:bg-slate-100"
                                    disabled={index === 0}
                                    onClick={() => moveUp(index)}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 hover:bg-slate-100"
                                    disabled={index === orderedItems.length - 1}
                                    onClick={() => moveDown(index)}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="mt-4 flex-shrink-0">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary text-white">
                        <Save className="mr-2 h-4 w-4" />
                        บันทึก
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
