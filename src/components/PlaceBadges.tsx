import { useTranslations } from "next-intl";
import { Badge } from "./ui";

interface PlaceBadgesProps {
  isCapital?: boolean;
  isMetro?: boolean;
  tier?: number;
}

export function PlaceBadges({ isCapital, isMetro, tier }: PlaceBadgesProps) {
  const t = useTranslations("Common");

  if (!isCapital && !isMetro && !tier) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isCapital && <Badge variant="accent">{t("capital")}</Badge>}
      {isMetro && <Badge variant="accent">{t("metro")}</Badge>}
      {tier && <Badge>{t("tier", { tier })}</Badge>}
    </div>
  );
}
