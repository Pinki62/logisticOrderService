import User from './user.js';
import Product from './product.js';
import Order from './order.js';
import OrderItem from './orderItem.js';

User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders',
});

Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'orderItems',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});