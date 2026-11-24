import dotenv from 'dotenv';
import express from 'express';
import sequelize from './config/database';
import './models/associations';
import cors from 'cors';
import authRoutes from './routes/authRoute';
import productRoutes from './routes/productRoute';
import orderRoutes from './routes/orderRoute';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use(cors());
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

void startServer();