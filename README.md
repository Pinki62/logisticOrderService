# Logistics Order Service

A full-stack order management application. Users can browse products, create orders, view their order history, and cancel eligible orders. The API handles stock changes in PostgreSQL transactions.

## Technology

- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM and migrations: Sequelize and Sequelize CLI
- Authentication: JWT and bcrypt
- Frontend: Angular
- API client: Angular HttpClient

## Architecture

The backend is organized into routes, controllers, middleware, models, and database configuration. Sequelize models map to the `users`, `products`, `orders`, and `order_items` tables. Database schema changes are managed by migrations; the application does not use `sequelize.sync()`.

Order creation and cancellation run in Sequelize-managed transactions. Order creation locks product rows while checking and reducing stock. If any requested product is unavailable or an operation fails, the transaction rolls back. Cancellation locks the order and products, restores stock, and updates the order status in the same transaction.

The Angular frontend uses services to call the API, an interceptor to attach the JWT, and a route guard to protect authenticated pages.

## Requirements

- Node.js and npm
- PostgreSQL
- Angular CLI

## Database setup

Create a PostgreSQL database named `logistics_assessment`.

## Backend setup

```bash
cd backend
npm install
```

## Frontend setup

```bash
cd frontend
npm install --legacy-peer-deps
ng serve
```
