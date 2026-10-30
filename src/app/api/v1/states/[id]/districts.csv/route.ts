import { states } from "@/data/india";
import { toCsv } from "@/lib/csv";
import { DISTRICT_COLUMNS } from "@/lib/open-data";
import { csv, readDistricts } from "@/lib/open-data-server";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return states.map((state) => ({ id: state.id }));
}

export async function GET(_request: Request, { params }: RouteContext<"/api/v1/states/[id]/districts.csv">) {
  const { id } = await params;
  return csv(toCsv(await readDistricts(id), DISTRICT_COLUMNS), `${id.toLowerCase()}-districts.csv`);
}
