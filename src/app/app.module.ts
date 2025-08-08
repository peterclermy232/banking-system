import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Routing Module
import { AppRoutingModule } from './app-routing.module';

// Components
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { LoginComponent } from './components/auth/login/login.component';
import { TransferComponent } from './components/transfer/transfer/transfer.component';
import { LoansComponent } from './components/loans/loans/loans.component';
import { SavingsComponent } from './components/savings/savings/savings.component';
import { MembersComponent } from './components/members/members/members.component';
import { NavbarComponent } from './shared/navbar/navbar/navbar.component';
import { SidebarComponent } from './shared/sidebar/sidebar/sidebar.component';
import { LoadingComponent } from './shared/loading/loading.component';
import { NotificationComponent } from './shared/notification/notification.component';

// Services and Guards
import { ApiService } from './services/api.service';
import { LoadingService } from './services/loading.service';
import { NotificationService } from './services/notification.service';
import { authGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoadingInterceptor } from './interceptors/laoding.interceptor';
import { RegisterComponent } from './components/auth/register/register.component';
import { CommonModule } from '@angular/common';
import { MemberDetailsComponent } from './shared/modal/member-details/members-details.component';
import { MemberEditModalComponent } from './shared/modal/edit-member/member-edit-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    TransferComponent,
    LoansComponent,
    SavingsComponent,
    MembersComponent,
    NavbarComponent,
    SidebarComponent,
    LoadingComponent,
    NotificationComponent,
    RegisterComponent,
    MemberDetailsComponent,
    MemberEditModalComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CommonModule
  ],
  providers: [
    ApiService,
    LoadingService,
    NotificationService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
