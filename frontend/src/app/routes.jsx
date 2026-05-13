import { createBrowserRouter, Navigate } from "react-router";
import { AdminLayout } from "./components/AdminLayout.jsx";
import { EmployeeLayout } from "./components/EmployeeLayout.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Settings } from "./pages/Settings.jsx";
import { Users } from "./pages/Users.jsx";
import { Login } from "./pages/Login.jsx";
import { EmployeePos } from "./pages/EmployeePos.jsx";
import { EmployeeSales } from "./pages/EmployeeSales.jsx";
import { Registers } from "./pages/Registers.jsx";
import { Statistics } from "./pages/Statistics.jsx";

function RequireAuth({ children, adminOnly = false }) {
  const token = localStorage.getItem("pos_token");
  const userRaw = localStorage.getItem("pos_user");

  if (!token || !userRaw) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly) {
    const user = JSON.parse(userRaw);
    if (user.role !== "Admin") {
      return <Navigate to="/employee" replace />;
    }
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/admin",
    element: (
      <RequireAuth adminOnly>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "pos", Component: EmployeePos },
      { path: "registers", Component: Registers },
      { path: "statistics", Component: Statistics },
      { path: "users", Component: Users },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/employee",
    element: (
      <RequireAuth>
        <EmployeeLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: EmployeePos },
      { path: "sales", Component: EmployeeSales },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
