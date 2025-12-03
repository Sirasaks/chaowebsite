"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";

interface OrderingItem {
    id: number;
    name: string;
    image?: string;
    is_recommended: boolean;
    display_order: number;
    [key: string]: any;
}

interface OrderingDialogProps {
    title: string;
    items: OrderingItem[];
    onSave: (items: OrderingItem[]) => Promise<void>;
    trigger: React.ReactNode;
}

export function OrderingDialog({ title, items, onSave, trigger }: OrderingDialogProps) {
    const [open, setOpen] = useState(false);
    const [availableItems, setAvailableItems] = useState<OrderingItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<OrderingItem[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            // Split items into available and selected
            const selected = items
                .filter(i => i.is_recommended)
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

            const available = items.filter(i => !i.is_recommended);

            setSelectedItems(selected);
            setAvailableItems(available);
        }
    }, [open, items]);

    const moveToSelected = (item: OrderingItem) => {
        setAvailableItems(prev => prev.filter(i => i.id !== item.id));
        setSelectedItems(prev => [...prev, { ...item, is_recommended: true }]);
    };

    const moveToAvailable = (item: OrderingItem) => {
        setSelectedItems(prev => prev.filter(i => i.id !== item.id));
        setAvailableItems(prev => [...prev, { ...item, is_recommended: false, display_order: 0 }]);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newItems = [...selectedItems];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        setSelectedItems(newItems);
    };

    const moveDown = (index: number) => {
        if (index === selectedItems.length - 1) return;
        const newItems = [...selectedItems];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setSelectedItems(newItems);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Prepare updated items
            // 1. Selected items get new display_order based on index
            const updatedSelected = selectedItems.map((item, index) => ({
                ...item,
                is_recommended: true,
                display_order: index
            }));

            // 2. Available items get is_recommended = false
            const updatedAvailable = availableItems.map(item => ({
                ...item,
                is_recommended: false,
                display_order: 0 // Reset order or keep as is, doesn't matter much if not recommended
            }));

            // Combine for saving
            const allUpdatedItems = [...updatedSelected, ...updatedAvailable];

            await onSave(allUpdatedItems);
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
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-hidden">
                    {/* Left Pane: Available */}
                    <div className="flex flex-col border rounded-md h-full overflow-hidden">
                        <div className="p-3 bg-slate-100 border-b font-medium shrink-0">
                            รายการทั้งหมด ({availableItems.length})
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {availableItems.map(item => (
                                <div key={item.id}
                                    className="flex items-center justify-between p-2 bg-white border rounded hover:bg-slate-50 cursor-pointer group"
                                    onClick={() => moveToSelected(item)}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.image ? (
                                            <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-200 shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-xs text-slate-500 shrink-0">No Img</div>
                                        )}
                                        <span className="text-sm font-medium line-clamp-1">{item.name}</span>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-green-600">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {availableItems.length === 0 && (
                                <div className="text-center text-slate-400 py-8 text-sm">ไม่มีรายการเหลืออยู่</div>
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Selected */}
                    <div className="flex flex-col border rounded-md border-primary h-full overflow-hidden">
                        <div className="p-3 bg-primary/10 border-b border-primary/20 font-medium text-primary flex justify-between items-center shrink-0">
                            <span>ที่เลือกแสดง ({selectedItems.length})</span>
                            <span className="text-xs text-primary/60 font-normal">บนสุด = แสดงก่อน</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-primary/10">
                            {selectedItems.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2 p-2 bg-white border border-primary/20 rounded shadow-sm">
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 hover:bg-primary/20 disabled:opacity-30"
                                            disabled={index === 0}
                                            onClick={() => moveUp(index)}
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <div className="text-center text-xs font-bold text-slate-400 w-6">{index + 1}</div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 hover:bg-primary/20 disabled:opacity-30"
                                            disabled={index === selectedItems.length - 1}
                                            onClick={() => moveDown(index)}
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {item.image ? (
                                            <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-200 shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-xs text-slate-500 shrink-0">No Img</div>
                                        )}
                                        <span className="text-sm font-medium line-clamp-1">{item.name}</span>
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => moveToAvailable(item)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {selectedItems.length === 0 && (
                                <div className="text-center text-slate-400 py-8 text-sm">ยังไม่ได้เลือกรายการ</div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 flex-shrink-0">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white">
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            บันทึกการเปลี่ยนแปลง
                        </>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
