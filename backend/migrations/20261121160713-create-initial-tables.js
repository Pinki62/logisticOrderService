'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      access: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('users', {
      fields: ['role'],
      type: 'check',
      name: 'users_role_valid',
      where: { role: ['ADMIN', 'USER'] },
    });

    await queryInterface.addConstraint('users', {
      fields: ['access'],
      type: 'check',
      name: 'users_access_valid',
      where: { access: ['VIEW', 'CREATE', null] },
    });

    await queryInterface.addConstraint('users', {
      fields: ['role', 'access'],
      type: 'check',
      name: 'users_access_matches_role',
      where: Sequelize.literal(
        `("role" = 'ADMIN' AND "access" IS NULL)
        OR ("role" = 'USER' AND "access" IN ('VIEW', 'CREATE'))`
      ),
    });

    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      stock_qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('products', {
      fields: ['stock_qty'],
      type: 'check',
      name: 'products_stock_nonnegative',
      where: { stock_qty: { [Sequelize.Op.gte]: 0 } },
    });

    await queryInterface.addConstraint('products', {
      fields: ['price'],
      type: 'check',
      name: 'products_price_nonnegative',
      where: { price: { [Sequelize.Op.gte]: 0 } },
    });

    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('orders', {
      fields: ['status'],
      type: 'check',
      name: 'orders_status_valid',
      where: { status: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
    });

    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('order_items', {
      fields: ['quantity'],
      type: 'check',
      name: 'order_items_quantity_positive',
      where: { quantity: { [Sequelize.Op.gt]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('users');
  },
};