import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService} from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { LoadingService } from '../../../services/loading.service';
import { RegisterRequest } from 'src/app/shared/interface/saving.interface';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = { width: 0, class: '', text: '' };

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
    this.registerForm = this.formBuilder.group({
      // memberNumber: ['', [
      //   Validators.required,
      //   Validators.pattern(/^MB\d+$/)
      // ]],
      nationalId: ['', [
        Validators.required,
        Validators.minLength(10)
      ]],
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phoneNumber: ['', [
        Validators.required,
        Validators.pattern(/^254[0-9]{9}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      agreeToTerms: [false, [
        Validators.requiredTrue
      ]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Watch password changes for strength indicator
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = { width: 0, class: '', text: '' };
      return;
    }

    let score = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) score += 20;
    else feedback.push('at least 8 characters');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 20;
    else feedback.push('uppercase letter');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 20;
    else feedback.push('lowercase letter');

    // Number check
    if (/\d/.test(password)) score += 20;
    else feedback.push('number');

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
    else feedback.push('special character');

    // Set strength indicator
    if (score < 40) {
      this.passwordStrength = { width: score, class: 'weak', text: 'Weak' };
    } else if (score < 80) {
      this.passwordStrength = { width: score, class: 'medium', text: 'Medium' };
    } else {
      this.passwordStrength = { width: score, class: 'strong', text: 'Strong' };
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.loadingService.show('Creating your account...');

      const formData: RegisterRequest = {
        //memberNumber: this.registerForm.value.memberNumber,
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        phoneNumber: this.registerForm.value.phoneNumber,
        password: this.registerForm.value.password,
        nationalId: this.registerForm.value.nationalId,
      };

      console.log('Submitting registration data:', formData);

      this.apiService.register(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.loadingService.hide();
          this.notificationService.showSuccess(
            'Account created successfully! Please sign in with your credentials.',
            'Registration Complete'
          );
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.loadingService.hide();

          console.error('Registration failed:', error);
          // Error notification is handled by the API service
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });

      this.notificationService.showWarning('Please fill in all required fields correctly.');
    }
  }
}
