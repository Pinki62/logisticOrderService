import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  sku: string;
  stock_qty: number;
  price: string;
  created_at: string;
}

export interface ProductPage {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = 'http://localhost:3000/products';

  constructor(private readonly http: HttpClient) {}

  getProducts(
    search = '',
    page = 1,
    limit = 10
  ): Observable<ProductPage> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ProductPage>(this.apiUrl, { params });
  }
}