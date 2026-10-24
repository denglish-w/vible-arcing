import { resolve } from "node:path";
import {
  commonDir,
  git,
  gitOk,
  listWorktrees,
  resolveCommit,
} from "./lib/git.ts";
import { check } from "./lib/check.ts";
import { normalizeClaim, repoRelative, worktreeFor } from "./lib/paths.ts";
import {
  prune,
  quote,
  quoteNote,
  readClaims,
  updateClaims,
} from "./lib/store.ts";

const USAGE = `usage: coord <command>
  claim <path>... [--note <text>]   record files or folders (trailing /) this worktree will change
  release [<path>...]               drop these claims, or all of this worktree's claims
  list                              show every live claim
  check                             test-merge against other worktrees and the integration branch
  prune                             delete stale claims, locks and seen files
  base [<branch>]                   show or set the integration branch (agentcoord.base)
`;

class UsageError extends Error {}

function age(iso: string): string {
  const m = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (!(m >= 1)) return "<1m";
  return m < 60
    ? `${m}m`
    : m < 1440
      ? `${Math.floor(m / 60)}h`
      : `${Math.floor(m / 1440)}d`;
}

function main(argv: string[]): number {
  const [cmd, ...args] = argv;
  if (!cmd || cmd === "--help" || cmd === "-h") {
    process.stdout.write(USAGE);
    return cmd ? 0 : 2;
  }
  // INIT_CWD is only meaningful under npm, where the process starts in the package root.
  const from =
    (process.env.npm_lifecycle_event && process.env.INIT_CWD) || process.cwd();
  const worktrees = listWorktrees({ cwd: from });
  const me = worktreeFor(from, from, worktrees);
  if (!me) throw new UsageError("not inside a worktree of this repository");
  const common = commonDir({ cwd: me.path });
  const paths = (list: string[]) =>
    list.map((a) => {
      if (repoRelative(me.path, resolve(from, a)) === "")
        throw new UsageError("cannot claim the whole worktree");
      const p = normalizeClaim(a, me.path, from);
      if (!p)
        throw new UsageError(`${a}: not a file or folder inside this worktree`);
      return p;
    });

  switch (cmd) {
    case "claim": {
      const i = args.indexOf("--note");
      if (i >= 0 && !args[i + 1]) throw new UsageError("--note needs a text");
      const note = i >= 0 ? args[i + 1].trim().slice(0, 200) : undefined;
      const targets = paths(
        i >= 0 ? args.filter((_, j) => j !== i && j !== i + 1) : args,
      );
      if (!targets.length)
        throw new UsageError("claim needs at least one path");
      const at = new Date().toISOString();
      updateClaims(common, me, (claims) => [
        ...claims.filter((c) => !targets.includes(c.path)),
        ...targets.map((path) => ({ path, ...(note ? { note } : {}), at })),
      ]);
      for (const p of targets) console.log(`claimed ${p}`);
      return 0;
    }
    case "release": {
      const targets = args.length ? paths(args) : null;
      let dropped = 0;
      updateClaims(common, me, (claims) => {
        const keep = targets
          ? claims.filter((c) => !targets.includes(c.path))
          : [];
        dropped = claims.length - keep.length;
        return keep;
      });
      console.log(`released ${dropped} claim(s)`);
      return 0;
    }
    case "list": {
      const rows = readClaims(common, worktrees).flatMap(
        ({ worktree: w, claims }) =>
          claims.map((c) => {
            const note = c.note ? `  note: ${quoteNote(c.note)}` : "";
            const here = w.path === me.path ? " (this worktree)" : "";
            return `${quote(c.path)}  ${quote(w.branch ?? "detached")} ${quote(w.path)}${here}  ${age(c.at)}${note}`;
          }),
      );
      console.log(rows.length ? rows.join("\n") : "no claims");
      return 0;
    }
    case "check": {
      const { lines, code } = check(me, worktrees);
      console.log(lines.join("\n"));
      return code;
    }
    case "prune": {
      const removed = prune(common, worktrees);
      console.log(
        removed.length ? `removed ${removed.join(", ")}` : "nothing to prune",
      );
      return 0;
    }
    case "base": {
      const opts = { cwd: me.path };
      if (args[0]) {
        if (!resolveCommit(args[0], opts))
          throw new UsageError(`${args[0]}: not a commit`);
        gitOk(["config", "agentcoord.base", args[0]], opts);
        console.log(`base set to ${args[0]}`);
      } else {
        const r = git(["config", "--get", "agentcoord.base"], opts);
        console.log(r.status === 0 ? r.stdout.trim() : "main (default)");
      }
      return 0;
    }
    default:
      throw new UsageError(`unknown command: ${cmd}`);
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  process.stderr.write(`coord: ${(e as Error).message}\n`);
  if (e instanceof UsageError) process.stderr.write(USAGE);
  process.exitCode = 2;
}
