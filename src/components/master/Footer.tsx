export function MasterFooter() {
    return (
        <footer className="bg-slate-900 py-12 text-slate-300">
            <div className="container mx-auto px-4">
                <div className="grid gap-8 md:grid-cols-4">
                    <div>
                        <h3 className="mb-4 text-lg font-bold text-white">ChaoWeb</h3>
                        <p className="text-sm">
                            The best platform for creating your own game top-up shop.
                        </p>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold text-white">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li>Features</li>
                            <li>Pricing</li>
                            <li>Showcase</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold text-white">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li>About</li>
                            <li>Blog</li>
                            <li>Careers</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold text-white">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li>Privacy</li>
                            <li>Terms</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm">
                    © {new Date().getFullYear()} ChaoWeb Platform. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
