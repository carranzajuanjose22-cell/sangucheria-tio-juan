import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SubscriptionProvider } from "./modules/subscription/index.jsx";

export default function App() {
  return (
    <SubscriptionProvider>
      <RouterProvider router={router} />
    </SubscriptionProvider>
  );
}
