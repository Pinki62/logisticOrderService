'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

    if (!email || !password || password.length < 6) {
      throw new Error(
        'Set BOOTSTRAP_ADMIN_EMAIL and a 6+ character BOOTSTRAP_ADMIN_PASSWORD in .env.'
      );
    }

    const [admins] = await queryInterface.sequelize.query(
      'SELECT "id" FROM "users" WHERE "role" = :role LIMIT 1',
      { replacements: { role: 'ADMIN' } }
    );

    if (admins.length > 0) {
      return;
    }

    const [existingUsers] = await queryInterface.sequelize.query(
      'SELECT "id" FROM "users" WHERE "email" = :email LIMIT 1',
      { replacements: { email } }
    );

    if (existingUsers.length > 0) {
      throw new Error('The bootstrap admin email is already used by another account.');
    }

    await queryInterface.bulkInsert('users', [
      {
        email,
        password_hash: await bcrypt.hash(password, 12),
        role: 'ADMIN',
        access: null,
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    if (!email) return;

    await queryInterface.bulkDelete('users', {
      email,
      role: 'ADMIN',
    });
  },
};