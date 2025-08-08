import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { Subscription } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  animations: [
    // Animation for smooth fade in/out
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoadingComponent implements OnInit, OnDestroy {
  isLoading = false;
  loadingMessage = '';
  private subscription: Subscription = new Subscription();

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    // Subscribe to loading state changes
    this.subscription.add(
      this.loadingService.loading$.subscribe(isLoading => {
        this.isLoading = isLoading;
      })
    );

    // Subscribe to loading message changes
    this.subscription.add(
      this.loadingService.loadingMessage$.subscribe(message => {
        this.loadingMessage = message;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
