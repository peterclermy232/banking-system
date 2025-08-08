// src/app/components/member-edit-modal/member-edit-modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Member } from 'src/app/models/account.model';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-member-edit-modal',
  templateUrl: './member-edit-modal.component.html',
  styleUrls: ['./member-edit-modal.component.scss']
})
export class MemberEditModalComponent implements OnInit {
  @Input() member: Member | null = null;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() memberUpdated = new EventEmitter<Member>();

  editForm: FormGroup;
  isSubmitting = false;
  activeTab = 'personal'; // 'personal' or 'contact'

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.member) {
      this.populateForm();
    }
  }

  ngOnChanges(): void {
    if (this.member && this.editForm) {
      this.populateForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Personal Information
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      idNumber: ['', [Validators.pattern(/^\d{8}$/)]],
      dateOfBirth: [''],
      
      // Contact Information
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+254|0)[17]\d{8}$/)]],
      physicalAddress: [''],
      
      // Employment Information (optional)
      employer: [''],
      monthlyIncome: ['', [Validators.min(0)]]
    });
  }

  private populateForm(): void {
    if (!this.member) return;

    this.editForm.patchValue({
      firstName: this.member.firstName,
      lastName: this.member.lastName,
      idNumber: this.member.idNumber || '',
      dateOfBirth: this.member.dateOfBirth ? this.formatDateForInput(this.member.dateOfBirth) : '',
      email: this.member.email,
      phoneNumber: this.member.phoneNumber,
      physicalAddress: this.member.physicalAddress || '',
      employer: this.member.employer || '',
      monthlyIncome: this.member.monthlyIncome || ''
    });
  }

  private formatDateForInput(date: string | Date): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0];
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  onSubmit(): void {
    if (this.editForm.invalid || !this.member) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.editForm.value;

    // Prepare update data
    const updateData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth || null,
      monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null
    };

    this.apiService.updateMember(this.member.memberNumber, updateData)
      .subscribe({
        next: (updatedMember) => {
          this.notificationService.show({
            type: 'success',
            title: 'Success',
            message: 'Member details updated successfully'
          });
          this.memberUpdated.emit(updatedMember);
          this.closeModal();
        },
        error: (error) => {
          console.error('Failed to update member:', error);
          this.notificationService.show({
            type: 'error',
            title: 'Error',
            message: 'Failed to update member details. Please try again.'
          });
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  closeModal(): void {
    this.close.emit();
    this.activeTab = 'personal';
    this.editForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['pattern']) {
      if (fieldName === 'phoneNumber') return 'Please enter a valid Kenyan phone number';
      if (fieldName === 'idNumber') return 'ID number must be 8 digits';
    }
    if (errors['minLength']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minLength'].requiredLength} characters`;
    if (errors['min']) return `${this.getFieldLabel(fieldName)} must be greater than 0`;

    return 'Invalid input';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      idNumber: 'ID Number',
      dateOfBirth: 'Date of Birth',
      email: 'Email Address',
      phoneNumber: 'Phone Number',
      physicalAddress: 'Physical Address',
      employer: 'Employer',
      monthlyIncome: 'Monthly Income'
    };
    return labels[fieldName] || fieldName;
  }
}