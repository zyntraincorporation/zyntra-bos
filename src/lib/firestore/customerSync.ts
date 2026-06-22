import { findCustomerByPhone, addCustomer, updateCustomer } from './customers';
import type { Order } from '@/types';

/**
 * Called on every order save.
 * Auto-creates a new customer profile if the phone is new,
 * or updates totals on an existing profile.
 */
export async function syncCustomerFromOrder(order: Order): Promise<void> {
  const existing = await findCustomerByPhone(order.phone);
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  if (!existing) {
    await addCustomer({
      name: order.customerName,
      phone: order.phone,
      address: order.address,
      totalOrders: 1,
      totalSpending: order.sellingPrice * order.quantity,
      lastOrderDate: orderDate,
    });
  } else {
    await updateCustomer(existing.id, {
      name: order.customerName,
      address: order.address,
      totalOrders: existing.totalOrders + 1,
      totalSpending: existing.totalSpending + order.sellingPrice * order.quantity,
      lastOrderDate: orderDate,
    });
  }
}
