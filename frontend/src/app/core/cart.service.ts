import { computed, Injectable, signal } from '@angular/core';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>([]);

  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );

  readonly total = computed(() =>
    this.items().reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    )
  );

  add(product: Product): void {
    if (product.stock_qty < 1) return;

    this.items.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);

      if (existing) {
        return items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.stock_qty),
              }
            : item
        );
      }

      return [...items, { product, quantity: 1 }];
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    this.items.update((items) =>
      items
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.min(quantity, item.product.stock_qty),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  remove(productId: number): void {
    this.items.update((items) =>
      items.filter((item) => item.product.id !== productId)
    );
  }

  clear(): void {
    this.items.set([]);
  }
}