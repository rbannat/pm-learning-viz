import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent }   from './dashboard/dashboard.component';
import { CustomersComponent }   from './customers/customers.component';
import { CustomerDetailComponent }   from './customer-detail/customer-detail.component';
import { IndexCasesComponent }   from './index-cases/index-cases.component';
import { IndexCaseDetailComponent }   from './index-case-detail/index-case-detail.component';
import { PageNotFoundComponent }   from './page-not-found/page-not-found.component';
import { CustomerResolver }   from './shared/services/customer-resolver.service';
import { IndexCaseResolver }   from './shared/services/index-case-resolver.service';

const appRoutes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: {title: 'Dashboard'}
  },
  {
    path: 'customers',
    component: CustomersComponent,
    data: {title: 'Customers'},
  },
  {
    path: 'customers/:id',
    component: CustomerDetailComponent,
    data: {title: 'Customers'},
    resolve: {
      customer: CustomerResolver
    }
  },
  {
    path: 'index-cases',
    component: IndexCasesComponent,
    data: {title: 'Index Cases'},
  },
  {
    path: 'index-cases/:id',
    component: IndexCaseDetailComponent,
    data: {title: 'Index Cases'},
    resolve: {
      customer: IndexCaseResolver
    }
  },
  { path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(appRoutes) ],
  exports: [ RouterModule ],
  providers: [CustomerResolver, IndexCaseResolver]
})
export class AppRoutingModule { }
