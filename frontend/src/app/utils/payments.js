export function getSurchargePercent(methodName, availablePayments) {
  return availablePayments.find((p) => p.name === methodName)?.surcharge || 0;
}

function clampDiscountPercent(discountPercent) {
  return Math.min(100, Math.max(0, Number(discountPercent) || 0));
}

export function calculateSaleTotals(
  orderTotal,
  advanceAmount,
  primaryMethodName,
  availablePayments,
  discountPercent = 0
) {
  const safeDiscount = clampDiscountPercent(discountPercent);
  const discountAmount = parseFloat(((orderTotal * safeDiscount) / 100).toFixed(2));
  const subtotal = parseFloat((orderTotal - discountAmount).toFixed(2));
  const baseForSurcharge = Math.max(0, subtotal - (advanceAmount || 0));
  const surchargePercent = getSurchargePercent(primaryMethodName, availablePayments);
  const surchargeAmount = parseFloat(((baseForSurcharge * surchargePercent) / 100).toFixed(2));
  const total = parseFloat((subtotal + surchargeAmount).toFixed(2));
  const amountDue = Math.max(0, parseFloat((total - (advanceAmount || 0)).toFixed(2)));

  return {
    orderTotal,
    discountPercent: safeDiscount,
    discountAmount,
    subtotal,
    baseForSurcharge,
    surchargePercent,
    surchargeAmount,
    total,
    amountDue,
  };
}

export function getAmountDueForMethod(orderTotal, advanceAmount, methodName, availablePayments, discountPercent = 0) {
  return calculateSaleTotals(orderTotal, advanceAmount, methodName, availablePayments, discountPercent).amountDue;
}

export function buildInitialPayments(orderTotal, advanceAmount, availablePayments, discountPercent = 0) {
  const defaultMethod = availablePayments[0];
  if (!defaultMethod) return [{ method: "", amount: 0 }];

  return [{
    method: defaultMethod.name,
    amount: getAmountDueForMethod(orderTotal, advanceAmount, defaultMethod.name, availablePayments, discountPercent),
  }];
}

export function applyPaymentMethodChange(
  payments,
  index,
  methodName,
  orderTotal,
  advanceAmount,
  availablePayments,
  discountPercent = 0
) {
  const updated = payments.map((p, i) => (i === index ? { ...p, method: methodName } : p));

  if (updated.length === 1) {
    updated[0].amount = getAmountDueForMethod(orderTotal, advanceAmount, methodName, availablePayments, discountPercent);
    return updated;
  }

  if (index === 0) {
    const totalDue = getAmountDueForMethod(orderTotal, advanceAmount, methodName, availablePayments, discountPercent);
    const othersTotal = updated.slice(1).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    updated[0].amount = parseFloat(Math.max(0, totalDue - othersTotal).toFixed(2));
  }

  return updated;
}

export function removePaymentLine(
  payments,
  index,
  orderTotal,
  advanceAmount,
  availablePayments,
  discountPercent = 0
) {
  const filtered = payments.filter((_, i) => i !== index);
  if (filtered.length === 1) {
    filtered[0].amount = getAmountDueForMethod(
      orderTotal,
      advanceAmount,
      filtered[0].method,
      availablePayments,
      discountPercent
    );
  }
  return filtered;
}

export function applyDiscountChange(
  payments,
  orderTotal,
  advanceAmount,
  availablePayments,
  discountPercent
) {
  if (payments.length === 1) {
    return [{
      ...payments[0],
      amount: getAmountDueForMethod(
        orderTotal,
        advanceAmount,
        payments[0].method,
        availablePayments,
        discountPercent
      ),
    }];
  }

  const totalDue = getAmountDueForMethod(
    orderTotal,
    advanceAmount,
    payments[0]?.method,
    availablePayments,
    discountPercent
  );
  const othersTotal = payments.slice(1).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  return payments.map((payment, index) => (
    index === 0
      ? { ...payment, amount: parseFloat(Math.max(0, totalDue - othersTotal).toFixed(2)) }
      : payment
  ));
}
