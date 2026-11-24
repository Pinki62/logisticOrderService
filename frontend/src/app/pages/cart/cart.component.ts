import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { OrderService } from '../../core/order.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);

  readonly items = this.cartService.items;
  readonly total = this.cartService.total;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly canCreateOrder =
    this.authService.currentUser?.role === 'ADMIN' ||
    this.authService.currentUser?.access === 'CREATE';

  updateQuantity(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cartService.updateQuantity(productId, Number(input.value));
  }

  removeItem(productId: number): void {
    this.cartService.remove(productId);
  }

  createOrder(): void {
    if (this.items().length === 0 || !this.canCreateOrder) return;

    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    const requestItems = this.items().map((item) => ({
      sku: item.product.sku,
      qty: item.quantity,
    }));

    this.orderService.createOrder(requestItems).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.cartService.clear();
        this.message.set(
          `Order ${response.data.order.order_number} was placed successfully.`
        );
      },
      error: (response: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(response.error?.message ?? 'Could not place the order.');
      },
    });
  }

  formatLineTotal(price: string, quantity: number): number {
    return Number(price) * quantity;
  }
}