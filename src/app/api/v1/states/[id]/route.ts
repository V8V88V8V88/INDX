import { getStateById, states } from "@/data/india";
import { stateSummary } from "@/lib/open-data";
import { json, readDistricts } from "@/lib/open-data-server";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return states.map((state) => ({ id: state.id }));
}

export async function GET(_request: Request, { params }: RouteContext<"/api/v1/states/[id]">) {
  const state = getStateById((await params).id)!;
  return json({ ...stateSummary(state), districts: await readDistricts(state.id) });
}
