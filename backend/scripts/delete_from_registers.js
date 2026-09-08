require('dotenv/config');
const { db } = require('../src/db');
const { cloud_store } = require('../src/models/schema');
const { eq } = require('drizzle-orm');

function isCashPaymentMethod(method) {
  const normalized = String(method || '').toLowerCase().trim();
  return normalized === 'efectivo' || normalized === 'seña' || normalized === 'sena';
}

function getCashFromSales(sales) {
  return (sales || []).reduce((sum, sale) => {
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
    if (isCashPaymentMethod(sale.paymentMethod)) {
      return sum + (Number(sale.total) || 0);
    }
    return sum;
  }, 0);
}

function calculateRegisterCashSummary(initialCash, sales, expenses) {
  const initial = Number(initialCash) || 0;
  const cashSales = getCashFromSales(sales);
  const totalExpenses = (expenses || []).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const totalIncome = (sales || []).reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  return {
    initialCash: initial,
    cashSales,
    totalExpenses,
    totalIncome,
    totalSalesCount: (sales || []).length,
    expectedCash: initial + cashSales - totalExpenses,
  };
}

async function run() {
  try {
    const idsToRemove = ['fd8h5kbye', 'qvx52fmu7', 'uav9ohvzt', 'o1cxbvwic', 'lf4qn0b2m'];
    
    // Get pos_registers
    const res = await db.select().from(cloud_store).where(eq(cloud_store.key, 'pos_registers'));
    if (!res.length || !res[0].value) {
        console.log('No pos_registers found.');
        process.exit(0);
    }
    let registers = JSON.parse(res[0].value);
    
    let deletedCount = 0;
    for (let i = 0; i < registers.length; i++) {
        const reg = registers[i];
        if (reg.sales) {
            const originalLength = reg.sales.length;
            reg.sales = reg.sales.filter(s => !idsToRemove.includes(s.id));
            const removed = originalLength - reg.sales.length;
            if (removed > 0) {
                deletedCount += removed;
                const summary = calculateRegisterCashSummary(reg.initialCash, reg.sales, reg.expenses);
                reg.totalSalesCount = summary.totalSalesCount;
                reg.totalIncome = summary.totalIncome;
                reg.totalExpenses = summary.totalExpenses;
                reg.cashSales = summary.cashSales;
                reg.expectedCash = summary.expectedCash;
            }
        }
    }
    
    if (deletedCount > 0) {
        await db.update(cloud_store).set({ value: JSON.stringify(registers) }).where(eq(cloud_store.key, 'pos_registers'));
        console.log(`Se eliminaron ${deletedCount} ventas de pos_registers y se recalcularon los totales de la caja.`);
    } else {
        console.log('No se encontraron las ventas en pos_registers.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
