import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Shown when a signed-out visitor clicks "Learning" in the top bar.
export default function SignInPrompt({ open, onOpenChange, onSignIn }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to use Learning mode</DialogTitle>
          <DialogDescription>
            Learning mode saves your parsing practice to your account and syncs it
            across devices. Reading, the English drawer, and word details stay fully
            available without an account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep reading
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onSignIn();
            }}
            className="bg-primary text-primary-foreground"
          >
            Sign in / Create account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}