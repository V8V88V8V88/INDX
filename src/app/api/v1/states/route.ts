import { states } from "@/data/india";
import { stateSummary } from "@/lib/open-data";
import { json } from "@/lib/open-data-server";

export const dynamic = "force-static";

export function GET() {
  return json(states.map(stateSummary));
}
