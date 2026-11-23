import { getViajes } from "@/actions/viajes";
import HomeClient, { ViajeDashboard } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viajesRaw = await getViajes();
  const initialViajes: ViajeDashboard[] = JSON.parse(JSON.stringify(viajesRaw));

  return <HomeClient initialViajes={initialViajes} />;
}
