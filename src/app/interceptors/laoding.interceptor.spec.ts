import { TestBed } from '@angular/core/testing';

import { LaodingInterceptor } from './laoding.interceptor';

describe('LaodingInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      LaodingInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: LaodingInterceptor = TestBed.inject(LaodingInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
