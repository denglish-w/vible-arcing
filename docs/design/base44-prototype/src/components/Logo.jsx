import { Link } from "@tanstack/react-router";
import ChiRho from "./ChiRho";

// The brand mark: the Chi Rho symbol plus the product name, one link to the
// Contents page. The accessible label is "Home". The name hides on the
// narrowest screens so the top bar stays to hamburger + symbol + avatar.
export default function Logo({ to = "/" }) {
  return (
    <Link to={to} aria-label="Home" className="inline-flex items-center gap-2">
      <ChiRho className="h-8 w-[47px]" />
      <span className="hidden font-body text-[13px] font-semibold tracking-[0.14em] text-foreground [font-variant:small-caps] sm:inline">
        [Product&nbsp;Name]
      </span>
    </Link>
  );
}