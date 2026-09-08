require('dotenv/config');
const storeService = require('../src/services/storeService');

async function run() {
  try {
    const idsToRemove = ['fd8h5kbye', 'qvx52fmu7', 'uav9ohvzt', 'o1cxbvwic', 'lf4qn0b2m'];
    const sales = await storeService.getValue('pos_sales') || [];
    
    console.log(`Ventas originales: ${sales.length}`);
    const remainingSales = sales.filter(s => !idsToRemove.includes(s.id));
    console.log(`Ventas restantes tras eliminación: ${remainingSales.length}`);
    
    await storeService.setValue('pos_sales', remainingSales);
    console.log('Duplicados eliminados de pos_sales exitosamente.');
    
    const pending = await storeService.getValue('pos_pending_orders') || [];
    const remainingPending = pending.filter(o => !idsToRemove.includes(o.id));
    if (pending.length !== remainingPending.length) {
        await storeService.setValue('pos_pending_orders', remainingPending);
        console.log(`Eliminados ${pending.length - remainingPending.length} de pos_pending_orders.`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
