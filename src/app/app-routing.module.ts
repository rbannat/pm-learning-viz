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
    component: DashboardComponent
  },
  {
    path: 'customers',
    component: CustomersComponent
  },
  {
    path: 'customers/:id',
    component: CustomerComponent,
    resolve: {
      customer: CustomerResolver
    }
  },
  {
    path: 'index-cases',
    component: IndexCasesComponent
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
