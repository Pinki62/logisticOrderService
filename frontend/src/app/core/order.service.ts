import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface OrderSummary {
  id: number;
  user_id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
  item_count: number;
}

export interface OrderListResponse {
  data: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateOrderItem {
  sku: string;
  qty: number;
}

export interface CreatedOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
}

export interface CreateOrderResponse {
  data: {
    order: CreatedOrder;
    items: Array<{
      id: number;
      order_id: number;
      product_id: number;
      quantity: number;
      unit_price: string;
    }>;
  };
}

export interface OrderFilters {
  page: number;
  limit: number;
  status?: OrderStatus;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = 'http://localhost:3000/orders';

  constructor(private readonly http: HttpClient) {}

  createOrder(items: CreateOrderItem[]): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(this.apiUrl, { items });
  }

  getOrders(filters: OrderFilters): Observable<OrderListResponse> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('limit', filters.limit);

    if (filters.status) params = params.set('status', filters.status);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);

    return this.http.get<OrderListResponse>(this.apiUrl, { params });
  }

  cancelOrder(id: number): Observable<{ data: OrderSummary }> {
    return this.http.post<{ data: OrderSummary }>(
      `${this.apiUrl}/${id}/cancel`,
      {}
    );
  }
}