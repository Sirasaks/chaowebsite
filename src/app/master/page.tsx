import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MasterPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
            <h1 className="text-4xl font-bold text-slate-900">Welcome to ChaoWeb Platform</h1>
            <p className="mt-4 text-xl text-slate-600">Create your own game top-up shop in minutes!</p>

            <div className="mt-8 flex gap-4">
                <Link href="/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/80">
                        Get Started
                    </Button>
                </Link>
                <Link href="/login">
                    <Button variant="outline" size="lg" >
                        Login
                    </Button>
                </Link>
            </div>
        </div>
    )
}
