export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
            <div className="container mx-auto px-4">
                <p className="text-center text-sm text-gray-600">
                    © {currentYear} My Shop. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
