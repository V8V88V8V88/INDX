import { states } from "@/data/india";
import { toCsv } from "@/lib/csv";
import { STATE_COLUMNS } from "@/lib/open-data";
import { csv } from "@/lib/open-data-server";

export const dynamic = "force-static";

export function GET() {
  return csv(toCsv(states, STATE_COLUMNS), "india-states.csv");
}
