import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { REPO_URL } from "@/lib/site";
import { GitHubIcon, Wordmark } from "./ui";

const linkClass = "text-text-secondary transition-colors hover:text-text-primary";

export function Footer() {
  const t = useTranslations("Nav");

  return (
    <footer className="mx-auto mt-10 max-w-7xl px-6">
      <div className="border-t border-border-light pt-6">
      <div className="flex flex-col-reverse items-center gap-4 text-sm text-text-muted sm:flex-row sm:justify-between">
        <p>
          © 2026 INDX · {t("madeBy")}{" "}
          <a href="https://v8v88v8v88.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Vaibhav Pratap Singh
          </a>
        </p>
        <nav aria-label={t("footer")} className="flex items-center gap-5">
          <Link href="/about" className={linkClass}>
            {t("about")}
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 ${linkClass}`}
          >
            <GitHubIcon />
            {t("source")}
          </a>
        </nav>
      </div>
      <Wordmark
        variant="outline"
        className="mx-auto mt-12 w-full max-w-2xl select-none text-text-muted/60 [mask-image:linear-gradient(to_bottom,black_45%,transparent)]"
        dotClassName="stroke-accent-primary/70"
      />
      <div className="h-8" />
      </div>
    </footer>
  );
}
