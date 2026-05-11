import { ParametersTab } from "../components/ParametersTab";

export function Settings() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-gray-500">Gestiona las preferencias y opciones de tu cuenta.</p>
      </div>

      <div className="min-h-[500px]">
        <ParametersTab />
      </div>
    </div>
  );
}
