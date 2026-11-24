import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { ProductsComponent } from './pages/products/products.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];