import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  environment = { production: false }; // Replace with actual environment import

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      memberNumber: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loadingService.show('Signing you in...');

      const credentials = {
        memberNumber: this.loginForm.value.memberNumber,
        password: this.loginForm.value.password
      };

      this.apiService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.loadingService.hide();
          this.notificationService.showSuccess('Login successful!', 'Welcome back');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.loadingService.hide();

          let errorMessage = 'Login failed. Please check your credentials.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          }

          this.notificationService.showError(errorMessage, 'Login Failed');
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
