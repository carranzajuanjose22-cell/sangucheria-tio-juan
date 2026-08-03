import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { ShoppingCart, LogOut, Menu, X, Receipt } from "lucide-react";

export function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: "Punto de Venta", href: "/employee", icon: ShoppingCart },
    { name: "Ventas del Día", href: "/employee/sales", icon: Receipt },
  ];

  const handleLogout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out flex flex-col group lg:fixed lg:h-screen lg:z-50 ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        } lg:translate-x-0 lg:w-16 lg:hover:w-64 overflow-hidden`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 whitespace-nowrap overflow-hidden">
          <div className="flex items-center">
            <ShoppingCart className="flex-shrink-0 w-6 h-6 text-brand-1 ml-1" />
            <span className="text-xl font-bold text-gray-900 ml-3 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Punto de Venta
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-2 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-brand-4 text-brand-1"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`flex-shrink-0 ml-1 mr-3 h-5 w-5 ${isActive ? "text-brand-1" : "text-gray-400"}`} />
                  <span className="font-medium whitespace-nowrap transition-opacity duration-300 lg:opacity-0 group-hover:opacity-100">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 whitespace-nowrap overflow-hidden">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-2 py-3 text-gray-600 transition-colors rounded-lg hover:bg-brand-1/10 hover:text-brand-1-dark"
            >
              <LogOut className="flex-shrink-0 w-5 h-5 ml-1 mr-3 text-gray-400" />
              <span className="font-medium transition-opacity duration-300 lg:opacity-0 group-hover:opacity-100">
                Cerrar sesión
              </span>
            </button>
            <p className="mt-3 text-center text-[10px] text-gray-400 transition-opacity duration-300 lg:opacity-0 group-hover:opacity-100">
              © Desarrollado por Jpcfix
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-16">
        <header className="flex items-center h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 text-lg font-bold text-gray-900">Punto de Venta</span>
        </header>

        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
