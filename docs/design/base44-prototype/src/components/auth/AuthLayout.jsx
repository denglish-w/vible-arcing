import ChiRho from "@/components/ChiRho";

// Full-screen card shared by the auth pages; it sets its own color tokens so it
// stays readable under any theme. The Chi Rho brand mark replaces the old
// generic icon box so the sign-in screen matches the rest of the app.
export function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <ChiRho className="mx-auto mb-4 h-10 w-9 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}