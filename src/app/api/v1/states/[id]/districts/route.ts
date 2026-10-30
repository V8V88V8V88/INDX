import { states } from "@/data/india";
import { json, readDistricts } from "@/lib/open-data-server";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return states.map((state) => ({ id: state.id }));
}

export async function GET(_request: Request, { params }: RouteContext<"/api/v1/states/[id]/districts">) {
  return json(await readDistricts((await params).id));
}
