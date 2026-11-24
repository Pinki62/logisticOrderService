import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface OrderItemAttributes {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  created_at: Date;
}

type OrderItemCreationAttributes = Optional<
  OrderItemAttributes,
  'id' | 'created_at'
>;

class OrderItem extends Model<
  OrderItemAttributes,
  OrderItemCreationAttributes
> implements OrderItemAttributes {
  declare id: number;
  declare order_id: number;
  declare product_id: number;
  declare quantity: number;
  declare unit_price: string;
  declare created_at: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    unit_price: {
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
    tableName: 'order_items',
    timestamps: false,
  }
);

export default OrderItem;