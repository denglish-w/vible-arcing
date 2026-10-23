import { LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// The circular avatar button on the far right of the top bar. Signed in: shows
// the user's initial and opens a small menu with their name and Sign out.
// Signed out: a plain icon button that goes to the sign-in page. (Progress and
// Delete-account are deferred.)
export default function AccountMenu() {
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();
  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={navigateToLogin}
        aria-label="Sign in"
        title="Sign in"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        <User className="h-4 w-4" />
      </button>
    );
  }
  const name = user?.full_name || user?.email || "Account";
  const initial = (name.trim()[0] || "?").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-body text-sm font-normal text-foreground">
          {name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-foreground">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}