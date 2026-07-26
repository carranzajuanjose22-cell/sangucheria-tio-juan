import { formatMoney, formatMoneyDebit } from "../utils/numbers.js";

export function RegisterCashSummary({ summary, title = "Efectivo esperado en caja", compact = false }) {
  if (!summary) return null;

  const boxClass = compact
    ? "w-full bg-brand-4 border border-brand-3/60 rounded-lg p-4 space-y-2"
    : "w-full bg-brand-4/70 border border-brand-3/60 rounded-xl p-5 space-y-3";

  return (
    <div className={boxClass}>
      {title && (
        <p className={`font-bold text-gray-900 ${compact ? "text-sm mb-1" : "text-base"}`}>{title}</p>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Efectivo inicial</span>
        <span className="font-medium">{formatMoney(summary.initialCash || 0)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">+ Ingresos en efectivo</span>
        <span className="font-medium text-green-700">{formatMoney(summary.cashSales || 0)}</span>
      </div>
      <div className="flex justify-between text-sm border-b border-brand-3/40 pb-2">
        <span className="text-gray-600">− Gastos retirados</span>
        <span className="font-medium text-brand-1">{formatMoneyDebit(summary.totalExpenses || 0)}</span>
      </div>
      <div className={`flex justify-between items-center ${compact ? "pt-1" : "pt-2"}`}>
        <span className="font-bold text-gray-900">Efectivo a corroborar</span>
        <span className={`font-black text-brand-1 ${compact ? "text-lg" : "text-2xl"}`}>
          {formatMoney(summary.expectedCash || 0)}
        </span>
      </div>
      {!compact && (summary.totalIncome || 0) > 0 && (
        <p className="text-xs text-gray-500 pt-1 border-t border-brand-3/30">
          Total vendido del turno (todos los medios): {formatMoney(summary.totalIncome)} · {summary.totalSalesCount || 0} venta{(summary.totalSalesCount || 0) !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
