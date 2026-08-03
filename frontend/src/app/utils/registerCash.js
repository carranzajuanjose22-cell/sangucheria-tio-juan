function isCashPaymentMethod(method) {
  const normalized = String(method || "").toLowerCase().trim();
  return normalized === "efectivo" || normalized === "seña" || normalized === "sena";
}

export function getCashFromSales(sales = []) {
  return sales.reduce((sum, sale) => {
    if (sale.payments?.length > 0) {
      return sum + sale.payments.reduce(
        (paymentSum, payment) => (
          isCashPaymentMethod(payment.method)
            ? paymentSum + (Number(payment.amount) || 0)
            : paymentSum
        ),
        0
      );
    }

    const legacyMethod = String(sale.paymentMethod || "").toLowerCase();
    if (legacyMethod.includes("efectivo") && !legacyMethod.includes("débito") && !legacyMethod.includes("debito")) {
      return sum + (Number(sale.total) || 0);
    }
    if (isCashPaymentMethod(sale.paymentMethod)) {
      return sum + (Number(sale.total) || 0);
    }

    return sum;
  }, 0);
}

export function getTotalRegisterExpenses(expenses = []) {
  return expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
}

export function calculateExpectedCash({ initialCash = 0, sales = [], expenses = [] } = {}) {
  const initial = Number(initialCash) || 0;
  const cashSales = getCashFromSales(sales);
  const totalExpenses = getTotalRegisterExpenses(expenses);
  const totalIncome = sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  return {
    initialCash: initial,
    cashSales,
    totalExpenses,
    totalIncome,
    totalSalesCount: sales.length,
    expectedCash: initial + cashSales - totalExpenses,
  };
}
