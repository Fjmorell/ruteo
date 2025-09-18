import ChoferTracker from "../components/ChoferTracker";

export default function DashboardChofer() {
  // 👇 reemplazá con el ID real de tu chofer en Supabase
  const choferId = "92ec589d-3741-4c75-9962-da46bcf0f67d";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Panel del Chofer</h1>
      <ChoferTracker choferId={choferId} />
    </div>
  );
}
