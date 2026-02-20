import { ShoppingBag, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { getAdminSettings } from "@/lib/store";

export function Header() {
  const settings = getAdminSettings();
  const siteName = settings.siteName || "ThaiDeals";

  return (
    <header className="sticky top-0 z-50 border-b bg-primary">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-primary-foreground">
          <ShoppingBag className="h-7 w-7" />
          <span className="text-xl font-bold tracking-tight">{siteName}</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/wishlist"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">โปรด</span>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
