import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import sequelize from '../config/database.js';
import Order from '../models/order';
import OrderItem from '../models/orderItem';
import Product from '../models/product';
import { Op, Transaction, literal, WhereOptions } from 'sequelize';

class OrderRequestError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

interface RequestedItem {
  sku: string;
  qty: number;
}

export async function createOrder(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user?.id;
  const requestedItems: unknown = req.body.items;

  if (!userId) {
    res.status(401).json({ message: 'Authentication is required.' });
    return;
  }

  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    res.status(400).json({ message: 'At least one order item is required.' });
    return;
  }

  const quantitiesBySku = new Map<string, number>();

  for (const item of requestedItems as RequestedItem[]) {
    if (
      !item ||
      typeof item.sku !== 'string' ||
      !item.sku.trim() ||
      !Number.isInteger(item.qty) ||
      item.qty <= 0
    ) {
      res.status(400).json({
        message: 'Each item must have a SKU and a positive integer quantity.',
      });
      return;
    }

    const sku = item.sku.trim();
    quantitiesBySku.set(sku, (quantitiesBySku.get(sku) ?? 0) + item.qty);
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const skus = [...quantitiesBySku.keys()].sort();

      const products = await Product.findAll({
        where: { sku: { [Op.in]: skus } },
        order: [['sku', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const productsBySku = new Map(products.map((product) => [product.sku, product]));

      for (const sku of skus) {
        if (!productsBySku.has(sku)) {
          throw new OrderRequestError(`Product SKU ${sku} was not found.`, 404);
        }
      }

      let totalCents = 0;

      const orderItems = skus.map((sku) => {
        const product = productsBySku.get(sku)!;
        const quantity = quantitiesBySku.get(sku)!;

        if (product.stock_qty < quantity) {
          throw new OrderRequestError(
            `Insufficient stock for SKU ${sku}. Available: ${product.stock_qty}.`,
            409
          );
        }

        const unitPriceCents = Math.round(Number(product.price) * 100);
        totalCents += unitPriceCents * quantity;

        product.stock_qty -= quantity;

        return {
          product_id: product.id,
          quantity,
          unit_price: product.price,
        };
      });

      for (const sku of skus) {
        const product = productsBySku.get(sku)!;
        await product.save({ transaction });
      }

      const order = await Order.create(
        {
          user_id: userId,
          order_number: `ORD-${Date.now()}-${randomUUID().slice(0, 8)}`,
          status: 'PENDING',
          total_amount: (totalCents / 100).toFixed(2),
        },
        { transaction }
      );

      const savedItems = await OrderItem.bulkCreate(
        orderItems.map((item) => ({ ...item, order_id: order.id })),
        { transaction }
      );

      return { order, items: savedItems };
    });

    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof OrderRequestError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('Order creation failed:', error);
    res.status(500).json({ message: 'Could not create order.' });
  }
}

export async function listOrders(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Authentication is required.' });
    return;
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const filters: WhereOptions[] = [{ user_id: userId }];

  const status = req.query.status;
  if (status !== undefined) {
    if (
      typeof status !== 'string' ||
      !['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)
    ) {
      res.status(400).json({ message: 'Invalid order status filter.' });
      return;
    }
    filters.push({ status });
  }

  const from = req.query.from;
  if (from !== undefined) {
    const fromDate = new Date(String(from));
    if (Number.isNaN(fromDate.getTime())) {
      res.status(400).json({ message: 'Invalid from date.' });
      return;
    }
    filters.push({ created_at: { [Op.gte]: fromDate } });
  }

  const to = req.query.to;
  if (to !== undefined) {
    const toDate = new Date(String(to));
    if (Number.isNaN(toDate.getTime())) {
      res.status(400).json({ message: 'Invalid to date.' });
      return;
    }

    if (typeof to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      toDate.setUTCDate(toDate.getUTCDate() + 1);
      filters.push({ created_at: { [Op.lt]: toDate } });
    } else {
      filters.push({ created_at: { [Op.lte]: toDate } });
    }
  }

  try {
    const { count, rows } = await Order.findAndCountAll({
      where: { [Op.and]: filters },
      attributes: {
        include: [[
          literal(
          '(SELECT COALESCE(SUM("quantity"), 0) FROM "order_items" WHERE "order_items"."order_id" = "Order"."id")'          ),
          'item_count',
        ]],
      },
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']],
    });

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Order listing failed:', error);
    res.status(500).json({ message: 'Could not load orders.' });
  }
}

export async function cancelOrder(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user?.id;
  const orderId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ message: 'Authentication is required.' });
    return;
  }

  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ message: 'Invalid order ID.' });
    return;
  }

  try {
    const cancelledOrder = await sequelize.transaction(async (transaction) => {
      const order = await Order.findOne({
        where: { id: orderId, user_id: userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        throw new OrderRequestError('Order not found.', 404);
      }

      if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
        throw new OrderRequestError(
          'Only pending or confirmed orders can be cancelled.',
          409
        );
      }

      const items = await OrderItem.findAll({
        where: { order_id: order.id },
        transaction,
      });

      const productIds = [...new Set(items.map((item) => item.product_id))].sort(
        (a, b) => a - b
      );

      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const productsById = new Map(products.map((product) => [product.id, product]));

      for (const item of items) {
        const product = productsById.get(item.product_id);

        if (!product) {
          throw new OrderRequestError(
            'An order product is no longer available.',
            409
          );
        }

        product.stock_qty += item.quantity;
        await product.save({ transaction });
      }

      order.status = 'CANCELLED';
      await order.save({ transaction });

      return order;
    });

    res.json({ data: cancelledOrder });
  } catch (error) {
    if (error instanceof OrderRequestError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('Order cancellation failed:', error);
    res.status(500).json({ message: 'Could not cancel order.' });
  }
}