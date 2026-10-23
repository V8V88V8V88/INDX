import { Badge } from "./ui";

interface PlaceBadgesProps {
  isCapital?: boolean;
  isMetro?: boolean;
  tier?: number;
}

export function PlaceBadges({ isCapital, isMetro, tier }: PlaceBadgesProps) {
  if (!isCapital && !isMetro && !tier) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isCapital && <Badge variant="accent">Capital</Badge>}
      {isMetro && <Badge variant="soft">Metro</Badge>}
      {tier && <Badge>Tier {tier}</Badge>}
    </div>
  );
}
