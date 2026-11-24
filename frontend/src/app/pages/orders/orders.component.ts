import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import {
  OrderService,
  OrderStatus,
  OrderSummary,
} from '../../core/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly orders = signal<OrderSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);

  readonly filters = new FormGroup({
    status: new FormControl<OrderStatus | ''>(''),
    from: new FormControl(''),
    to: new FormControl(''),
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const values = this.filters.getRawValue();
    this.loading.set(true);
    this.error.set('');

    this.orderService.getOrders({
      page: this.page(),
      limit: 8,
      status: values.status || undefined,
      from: values.from || undefined,
      to: values.to || undefined,
    }).subscribe({
      next: (response) => {
        this.orders.set(response.data);
        this.totalItems.set(response.pagination.totalItems);
        this.totalPages.set(Math.max(1, response.pagination.totalPages));
        this.loading.set(false);
      },
      error: (response: HttpErrorResponse) => {
        this.error.set(response.error?.message ?? 'Could not load orders.');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadOrders();
  }

  previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((current) => current - 1);
    this.loadOrders();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((current) => current + 1);
    this.loadOrders();
  }

  canCancel(order: OrderSummary): boolean {
    return order.status === 'PENDING' || order.status === 'CONFIRMED';
  }

  cancelOrder(order: OrderSummary): void {
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return;

    this.orderService.cancelOrder(order.id).subscribe({
      next: () => {
        this.message.set(`Order ${order.order_number} cancelled. Stock was restored.`);
        this.loadOrders();
      },
      error: (response: HttpErrorResponse) => {
        this.error.set(response.error?.message ?? 'Could not cancel this order.');
      },
    });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth');
  }
}