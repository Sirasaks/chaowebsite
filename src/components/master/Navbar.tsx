import Link from "next/link";

export function MasterNavbar() {
    return (
        <nav className="border-b bg-white">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-xl font-bold text-blue-600">
                        ChaoWeb Platform
                    </Link>
                    <div className="hidden md:flex gap-4 text-sm font-medium text-gray-600">
                        <Link href="/packages">Packages</Link>
                        <Link href="/features">Features</Link>
                        <Link href="/contact">Contact</Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium hover:underline">
                        Login
                    </Link>
                    <Link
                        href="/register"
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}
