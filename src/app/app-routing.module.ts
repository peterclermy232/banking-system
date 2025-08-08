import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { TransferComponent } from './components/transfer/transfer/transfer.component';
import { LoansComponent } from './components/loans/loans/loans.component';
import { SavingsComponent } from './components/savings/savings/savings.component';
import { MembersComponent } from './components/members/members/members.component';
import { authGuard } from './guards/auth.guard';
import { MemberDetailsComponent } from './shared/modal/member-details/members-details.component';
import { MemberEditModalComponent } from './shared/modal/edit-member/member-edit-modal.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'transfer',
    component: TransferComponent,
    canActivate: [authGuard]
  },
  {
    path: 'loans',
    component: LoansComponent,
    canActivate: [authGuard]
  },
  {
    path: 'savings',
    component: SavingsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'members',
    component: MembersComponent,
    canActivate: [authGuard]
  },
  {
    // Route for viewing member details
    path: 'members/:memberNumber',
    component: MemberDetailsComponent,
    canActivate: [authGuard]
  },
  {
    // Route for editing member (if you have an edit component)
    path: 'members/:memberNumber/edit',
    component: MemberEditModalComponent, 
    canActivate: [authGuard]
  },
  {
    // Route for adding new member (if you have an add component)
    path: 'members/new',
    component: MemberDetailsComponent, // Replace with MemberAddComponent if you have one
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
