import Image from "next/image";
import { Menu, X, Search, User } from "lucide-react";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={50}
                    height={50}
                    className="rounded-full"
                />
                <div className="flex items-center gap-4">
                    <Search className="w-4 h-4 text-primary" />
                    <User className="w-4 h-4 text-primary" />
                    <Menu className="w-4 h-6 text-primary" />
                </div>
            </div>
        </header>
    );
}
