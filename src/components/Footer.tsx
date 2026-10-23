import Link from "next/link";
import { GitHubIcon } from "./ui";

const linkClass = "text-accent-primary transition-opacity hover:opacity-80";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border-light py-8 text-sm text-text-muted">
      <p className="mb-4 text-center">Maps, data, and everything in between</p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span>© 2026 INDX</span>
          <span aria-hidden="true">·</span>
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <span aria-hidden="true">·</span>
          <a
            href="https://github.com/v8V88V8V88/INDX"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 ${linkClass}`}
          >
            <GitHubIcon />
            Source
          </a>
        </div>
        <p>
          Made with <span className="text-accent-primary">❤️</span> by{" "}
          <a href="https://v8v88v8v88.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Vaibhav Pratap Singh
          </a>
        </p>
      </div>
    </footer>
  );
}
