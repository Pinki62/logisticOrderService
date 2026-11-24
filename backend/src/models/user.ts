import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export type UserRole = 'ADMIN' | 'USER';
export type UserAccess = 'VIEW' | 'CREATE';

interface UserAttributes {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  access: UserAccess | null;
  created_at: Date;
}

type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'access' | 'created_at'
>;

class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  declare id: number;
  declare email: string;
  declare password_hash: string;
  declare role: UserRole;
  declare access: UserAccess | null;
  declare created_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: { isIn: [['ADMIN', 'USER']] },
    },
    access: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: { isIn: [['VIEW', 'CREATE']] },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: false,
  }
);

export default User;