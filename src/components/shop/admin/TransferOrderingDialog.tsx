"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Plus, X, Save, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TransferItem {
    id: number;
    name: string;
    image?: string;
    isSelected: boolean;
    display_order?: number;
    [key: string]: any;
}

interface TransferOrderingDialogProps {
    title: string;
    items: TransferItem[];
    onSave: (selectedItems: TransferItem[]) => Promise<void>;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TransferOrderingDialog({ title, items, onSave, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: TransferOrderingDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

    const [availableItems, setAvailableItems] = useState<TransferItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (open) {
            // Split items into available and selected
            const selected = items
                .filter(i => i.isSelected)
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

            const available = items
                .filter(i => !i.isSelected)
                // Optionally sort available by name or ID
                .sort((a, b) => b.id - a.id);

            setSelectedItems(selected);
            setAvailableItems(available);
            setSearch("");
        }
    }, [open, items]);

    const moveToSelected = (item: TransferItem) => {
        setAvailableItems(prev => prev.filter(i => i.id !== item.id));
        setSelectedItems(prev => [...prev, { ...item, isSelected: true }]);
    };

    const moveToAvailable = (item: TransferItem) => {
        setSelectedItems(prev => prev.filter(i => i.id !== item.id));
        setAvailableItems(prev => [
            { ...item, isSelected: false },
            ...prev
        ].sort((a, b) => b.id - a.id)); // Keep available list sorted mostly for consistency
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
            await onSave(selectedItems);
            // If controlled, parent handles closing. If not, close self.
            if (!isControlled) {
                setOpen(false);
            }
        } catch (error) {
            console.error("Failed to save order:", error);
            // Toast should be handled by caller or here? Let's do nothing here and let caller handle errors if needed, 
            // but for UI feedback we can toast success if caller doesn't throw.
        } finally {
            setSaving(false);
        }
    };

    const filteredAvailable = availableItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className="max-w-7xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-hidden">
                    {/* Left Pane: Available */}
                    <div className="flex flex-col border rounded-md h-full overflow-hidden">
                        <div className="p-3 bg-slate-100 border-b font-medium shrink-0 flex flex-col gap-2">
                            <div>รายการสินค้า ({availableItems.length})</div>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="ค้นหา..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 pl-8 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {filteredAvailable.map(item => (
                                <div key={item.id}
                                    className="flex items-center justify-between p-2 bg-card text-card-foreground border rounded hover:bg-slate-50 cursor-pointer group"
                                    onClick={() => moveToSelected(item)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {item.image ? (
                                            <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-200 shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-xs text-slate-500 shrink-0">No Img</div>
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium">{item.name}</span>
                                            <span className="text-xs text-muted-foreground">฿{item.price} | stock: {item.stock}</span>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-green-600">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {filteredAvailable.length === 0 && (
                                <div className="text-center text-slate-400 py-8 text-sm">
                                    {search ? "ไม่พบสินค้าที่ค้นหา" : "ไม่มีสินค้า"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Selected */}
                    <div className="flex flex-col border rounded-md border-primary h-full overflow-hidden">
                        <div className="p-3 bg-primary/10 border-b border-primary/20 font-medium text-primary flex justify-between items-center shrink-0">
                            <span>ในหมวดหมู่ ({selectedItems.length})</span>
                            <span className="text-xs text-primary/60 font-normal">บนสุด = แสดงก่อน</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-primary/10">
                            {selectedItems.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2 p-2 bg-card text-card-foreground border border-primary/20 rounded shadow-sm">
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
                                        <span className="text-sm font-medium">{item.name}</span>
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
                                <div className="text-center text-slate-400 py-8 text-sm">ยังไม่ได้เลือกสินค้า</div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 flex-shrink-0">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary text-white">
                        {saving ? "กำลังบันทึก..." : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                บันทึกการเปลี่ยนแปลง
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
