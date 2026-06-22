import type { Order, AdSpend } from '@/types';

export interface OrderProfit {
  orderId: string;
  productName: string;
  revenue: number;
  purchaseCost: number;
  courierCost: number;
  packagingCost: number;
  allocatedAdCost: number;
  netProfit: number;
  margin: number; // %
}

const DEFAULT_COURIER_COST = 60;
const DEFAULT_PACKAGING_COST = 20;

export function calcOrderProfit(
  order: Order,
  purchasePricePerUnit: number,
  adSpends: AdSpend[]
): OrderProfit {
  const revenue = order.sellingPrice * order.quantity;
  const purchaseCost = purchasePricePerUnit * order.quantity;
  const courierCost = DEFAULT_COURIER_COST;
  const packagingCost = DEFAULT_PACKAGING_COST;

  // Allocate ad cost proportionally (total product ad spend / total product orders)
  const productAdSpend = adSpends
    .filter(a => a.productId === order.productId)
    .reduce((s, a) => s + a.amount, 0);
  // Simple heuristic: divide by estimated order volume (use 1 if can't compute)
  const allocatedAdCost = Math.round(productAdSpend * 0.05); // ~5% per order

  const netProfit = revenue - purchaseCost - courierCost - packagingCost - allocatedAdCost;
  const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  return {
    orderId: order.id,
    productName: order.productName,
    revenue,
    purchaseCost,
    courierCost,
    packagingCost,
    allocatedAdCost,
    netProfit,
    margin,
  };
}

export function calcProductProfitSummary(
  orders: Order[],
  productMap: Record<string, number>, // productId -> purchasePrice
  adSpends: AdSpend[]
) {
  const map: Record<string, { productName: string; units: number; revenue: number; cost: number; adCost: number }> = {};

  for (const order of orders) {
    if (order.status !== 'Delivered') continue;
    if (!map[order.productId]) {
      map[order.productId] = { productName: order.productName, units: 0, revenue: 0, cost: 0, adCost: 0 };
    }
    const p = map[order.productId];
    p.units += order.quantity;
    p.revenue += order.sellingPrice * order.quantity;
    p.cost += (productMap[order.productId] ?? 0) * order.quantity;
  }

  for (const a of adSpends) {
    if (map[a.productId]) {
      map[a.productId].adCost += a.amount;
    }
  }

  return Object.entries(map).map(([id, p]) => ({
    productId: id,
    productName: p.productName,
    unitsSold: p.units,
    revenue: p.revenue,
    cogs: p.cost,
    adSpent: p.adCost,
    netProfit: p.revenue - p.cost - p.adCost,
    margin: p.revenue > 0 ? Math.round(((p.revenue - p.cost - p.adCost) / p.revenue) * 100) : 0,
  }));
}
