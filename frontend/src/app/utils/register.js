import { api } from "../pages/api.js";

export async function closeRegister({ employee, closedBy }) {
  return api.post("/store/operations/close-register", {
    employee,
    closedBy: closedBy || employee,
  });
}

export async function appendSale(sale) {
  return api.post("/store/operations/append-sale", { sale });
}
