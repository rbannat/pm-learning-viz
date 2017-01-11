import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent }   from './dashboard/dashboard.component';
import { CustomersComponent }   from './customers/customers.component';
import { CustomerComponent }   from './customer/customer.component';
import { IndexCasesComponent }   from './index-cases/index-cases.component';
import { PageNotFoundComponent }   from './page-not-found/page-not-found.component';
import { CustomerResolver }   from './shared/customer-resolver.service';
import {UpdateCaseService} from "./shared/update-case.service";

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
    component: CustomerComponent,
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
  { path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(appRoutes) ],
  exports: [ RouterModule ],
  providers: [CustomerResolver, UpdateCaseService]
})
export class AppRoutingModule { }
