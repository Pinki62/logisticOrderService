import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface OrderAttributes {
  id: number;
  user_id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: string;
  created_at: Date;
}

type OrderCreationAttributes = Optional<
  OrderAttributes,
  'id' | 'status' | 'created_at'
>;

class Order extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes {
  declare id: number;
  declare user_id: number;
  declare order_number: string;
  declare status: OrderStatus;
  declare total_amount: string;
  declare created_at: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING',
      validate: { isIn: [['PENDING', 'CONFIRMED', 'CANCELLED']] },
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: false,
  }
);

export default Order;