import { routeMetadata } from "@/i18n/metadata";
import { HomePage } from "./HomePage";

export function generateMetadata({ params }: PageProps<"/[locale]">) {
  return routeMetadata(params, "/", null, "description");
}

export default function Page() {
  return <HomePage />;
}
