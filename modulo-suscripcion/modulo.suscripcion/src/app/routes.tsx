import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AdminLayout } from "./components/AdminLayout";
import { EmployeeLayout } from "./components/EmployeeLayout";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { Users } from "./pages/Users";
import { Login } from "./pages/Login";
import { EmployeePos } from "./pages/EmployeePos";
import { EmployeeSales } from "./pages/EmployeeSales";
import { Registers } from "./pages/Registers";
import { Statistics } from "./pages/Statistics";
import { CreatorDashboard, SubscriptionOverlay } from "./modules/subscription/index.jsx";

function RootLayout() {
  return (
    <>
      <Outlet />
      <SubscriptionOverlay />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: Login,
      },
      {
        path: "creator",
        Component: CreatorDashboard,
      },
      {
        path: "admin",
        Component: AdminLayout,
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
        path: "employee",
        Component: EmployeeLayout,
        children: [
          { index: true, Component: EmployeePos },
          { path: "sales", Component: EmployeeSales },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
