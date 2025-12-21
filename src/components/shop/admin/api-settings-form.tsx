"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export function ApiSettingsForm() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({

        slipok_api_key: "",
        slipok_branch_id: "",
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/shop/admin/settings/keys");
                if (res.ok) {
                    const data = await res.json();
                    setFormData({

                        slipok_api_key: data.slipok_api_key || "",
                        slipok_branch_id: data.slipok_branch_id || "",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                toast.error("ไม่สามารถดึงข้อมูลการตั้งค่าได้");
            } finally {
                setFetching(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/shop/admin/settings/keys", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update settings");
            }

            toast.success(data.message || "บันทึกการตั้งค่าเรียบร้อยแล้ว");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ตั้งค่า API Keys</CardTitle>
                <CardDescription>
                    จัดการ API Key สำหรับเชื่อมต่อบริการภายนอก
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">

                    </div>



                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">SlipOk API</h3>
                        <div className="grid gap-2">
                            <Label htmlFor="slipok_api_key">API Key</Label>
                            <Input
                                id="slipok_api_key"
                                name="slipok_api_key"
                                type="password"
                                value={formData.slipok_api_key}
                                onChange={handleChange}
                                placeholder="กรอก SlipOk API Key"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slipok_branch_id">Branch ID</Label>
                            <Input
                                id="slipok_branch_id"
                                name="slipok_branch_id"
                                value={formData.slipok_branch_id}
                                onChange={handleChange}
                                placeholder="กรอก Branch ID"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        บันทึกการตั้งค่า
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
