import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { Product, ProductService } from '../../core/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);
  readonly cartCount = this.cartService.itemCount;
  readonly user = this.authService.currentUser;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(startWith(this.searchControl.value), debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadProducts();
      });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.productService
      .getProducts(this.searchControl.value, this.page(), 8)
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.totalItems.set(response.pagination.totalItems);
          this.totalPages.set(Math.max(1, response.pagination.totalPages));
          this.loading.set(false);
        },
        error: (response) => {
          this.error.set(response.error?.message ?? 'Could not load products.');
          this.loading.set(false);
        },
      });
  }

  addToCart(product: Product): void {
    this.cartService.add(product);
    this.notice.set(`${product.name} added to cart.`);
  }

  previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((value) => value - 1);
    this.loadProducts();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((value) => value + 1);
    this.loadProducts();
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth');
  }
}