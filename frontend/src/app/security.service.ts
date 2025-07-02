// security.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private currentRouteSubject = new BehaviorSubject<string>('');
  currentRoute$ = this.currentRouteSubject.asObservable();

  constructor(private router: Router) {
    console.log('🛠 Router injected:', !!router);
    this.currentRouteSubject.next(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRouteSubject.next(event.urlAfterRedirects);
        console.log('🔐 Navigated to:', event.urlAfterRedirects);
      });
    this.router.events.subscribe((event) => {
      console.log('📦 Router event received:', event);
    });
  }

  getCurrentRoute(): string {
    return this.currentRouteSubject.value;
  }
}
