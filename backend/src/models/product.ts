import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface ProductAttributes {
  id: number;
  name: string;
  sku: string;
  stock_qty: number;
  price: string;
  created_at: Date;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  'id' | 'created_at'
>;

class Product extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes {
  declare id: number;
  declare name: string;
  declare sku: string;
  declare stock_qty: number;
  declare price: string;
  declare created_at: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    stock_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    price: {
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
    tableName: 'products',
    timestamps: false,
  }
);

export default Product;