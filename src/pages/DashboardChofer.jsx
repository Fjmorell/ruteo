// src/pages/DashboardChofer.jsx
import ChoferTracker from "../components/ChoferTracker";

export default function DashboardChofer() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard del Chofer</h1>
      <ChoferTracker choferId="b5a8f906-250d-458f-b955-76889c1001f4" />
    </div>
  );
}
