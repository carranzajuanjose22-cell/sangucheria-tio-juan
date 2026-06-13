import { Sliders } from "lucide-react";
import { ParametersTab } from "../components/ParametersTab";

export function Settings() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-gray-500">Gestiona las preferencias y opciones de tu cuenta.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-4 h-full">
          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
            <nav className="space-y-1">
              <button
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-blue-700 bg-blue-50"
              >
                <Sliders className="w-4 h-4 mr-3" />
                Parámetros
              </button>
            </nav>
          </div>

          <div className="p-6 md:col-span-3">
            <ParametersTab />
          </div>
        </div>
      </div>
    </div>
  );
}
