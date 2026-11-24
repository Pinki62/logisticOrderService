import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import Product from '../models/product';

export async function listProducts(
  req: Request,
  res: Response
): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const search = typeof req.query.search === 'string'
    ? req.query.search.trim()
    : '';

  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { sku: { [Op.iLike]: `%${search}%` } },
        ],
      }
    : {};

  try {
    const { count, rows } = await Product.findAndCountAll({
      where,
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
    console.error('Product listing failed:', error);
    res.status(500).json({ message: 'Could not load products.' });
  }
}

export async function createProduct(
  req: Request,
  res: Response
): Promise<void> {
  const { name, sku, stock_qty, price } = req.body;
  const quantity = Number(stock_qty);
  const productPrice = Number(price);

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof sku !== 'string' ||
    !sku.trim() ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    !Number.isFinite(productPrice) ||
    productPrice < 0
  ) {
    res.status(400).json({
      message: 'Name, SKU, non-negative stock quantity, and non-negative price are required.',
    });
    return;
  }

  try {
    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim(),
      stock_qty: quantity,
      price: productPrice.toFixed(2),
    });

    res.status(201).json({ data: product });
  } catch (error) {
    console.error('Product creation failed:', error);
    res.status(500).json({ message: 'Could not create product.' });
  }
}