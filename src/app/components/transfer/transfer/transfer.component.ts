import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {
  transferForm: FormGroup;
  recentRecipients: { name: string; accountNumber: string; memberNumber: string }[] = [];
  memberAccounts: any[] = [];

  constructor(private fb: FormBuilder, private apiService: ApiService,private router: Router) {
    this.transferForm = this.fb.group({
      fromAccountNumber: ['', Validators.required],
      toAccountNumber: ['', Validators.required],
      transferType: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      description: [''],
      reference: ['']
    });
  }

  ngOnInit(): void {
    this.fetchRecentRecipients();
  }

  fetchRecentRecipients(): void {
    this.apiService.getMemberAccounts().subscribe((accounts) => {
      this.memberAccounts = accounts;
      const uniqueRecipients = new Map<string, { name: string; accountNumber: string, memberNumber: string }>();

      for (const acc of accounts) {
        if (acc.memberName && acc.accountNumber && !uniqueRecipients.has(acc.accountNumber)) {
          uniqueRecipients.set(acc.accountNumber, {
            name: acc.memberName,
            accountNumber: acc.accountNumber,
            memberNumber: acc.memberNumber
          });
        }
      }

      this.recentRecipients = Array.from(uniqueRecipients.values());
    });
  }

  calculateFee(): number {
    const amount = this.transferForm.get('amount')?.value || 0;
    const transferType = this.transferForm.get('transferType')?.value;

    if (transferType === 'INTERNAL') return 0;
    if (transferType === 'EXTERNAL') return Math.min(amount * 0.01, 100);
    if (transferType === 'MPESA') return Math.min(amount * 0.015, 150);

    return 0;
  }

  getTotal(): number {
    const amount = this.transferForm.get('amount')?.value || 0;
    return amount + this.calculateFee();
  }

  selectRecipient(recipient: any): void {
    this.transferForm.patchValue({
      toAccountNumber: recipient.accountNumber
    });
  }

  onTransfer(): void {
  if (this.transferForm.valid) {
    const payload = this.transferForm.value;
    const type = payload.transferType?.toLowerCase();

    let transferObservable;

    if (type === 'internal') {
      transferObservable = this.apiService.internalTransfer(payload);
    } else if (type === 'external') {
      transferObservable = this.apiService.externalTransfer(payload);
    } else if (type === 'mpesa') {
      transferObservable = this.apiService.mpesaTransfer(payload);
    }

    if (transferObservable) {
      transferObservable.subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Transfer Successful!',
            text: `KSH ${payload.amount} sent successfully.`,
            timer: 2000,
            timerProgressBar: true,
            willClose: () => {
              this.router.navigate(['/dashboard']);
            }
          });
          this.transferForm.reset();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Transfer Failed',
            text: err.error?.message || 'Something went wrong. Please try again.',
          });
        }
      });
    }

    console.log('Transfer payload:', payload);
  }
}
}
