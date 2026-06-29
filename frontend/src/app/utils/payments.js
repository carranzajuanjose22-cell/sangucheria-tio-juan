export function getSurchargePercent(methodName, availablePayments) {
  return availablePayments.find((p) => p.name === methodName)?.surcharge || 0;
}

export function calculateSaleTotals(orderTotal, advanceAmount, primaryMethodName, availablePayments) {
  const subtotal = orderTotal;
  const baseForSurcharge = Math.max(0, orderTotal - (advanceAmount || 0));
  const surchargePercent = getSurchargePercent(primaryMethodName, availablePayments);
  const surchargeAmount = (baseForSurcharge * surchargePercent) / 100;
  const total = subtotal + surchargeAmount;
  const amountDue = Math.max(0, total - (advanceAmount || 0));

  return {
    subtotal,
    baseForSurcharge,
    surchargePercent,
    surchargeAmount,
    total,
    amountDue: parseFloat(amountDue.toFixed(2)),
  };
}

export function getAmountDueForMethod(orderTotal, advanceAmount, methodName, availablePayments) {
  return calculateSaleTotals(orderTotal, advanceAmount, methodName, availablePayments).amountDue;
}

export function buildInitialPayments(orderTotal, advanceAmount, availablePayments) {
  const defaultMethod = availablePayments[0];
  if (!defaultMethod) return [{ method: "", amount: 0 }];

  return [{
    method: defaultMethod.name,
    amount: getAmountDueForMethod(orderTotal, advanceAmount, defaultMethod.name, availablePayments),
  }];
}

export function applyPaymentMethodChange(payments, index, methodName, orderTotal, advanceAmount, availablePayments) {
  const updated = payments.map((p, i) => (i === index ? { ...p, method: methodName } : p));

  if (updated.length === 1) {
    updated[0].amount = getAmountDueForMethod(orderTotal, advanceAmount, methodName, availablePayments);
    return updated;
  }

  if (index === 0) {
    const totalDue = getAmountDueForMethod(orderTotal, advanceAmount, methodName, availablePayments);
    const othersTotal = updated.slice(1).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    updated[0].amount = parseFloat(Math.max(0, totalDue - othersTotal).toFixed(2));
  }

  return updated;
}

export function removePaymentLine(payments, index, orderTotal, advanceAmount, availablePayments) {
  const filtered = payments.filter((_, i) => i !== index);
  if (filtered.length === 1) {
    filtered[0].amount = getAmountDueForMethod(
      orderTotal,
      advanceAmount,
      filtered[0].method,
      availablePayments
    );
  }
  return filtered;
}
