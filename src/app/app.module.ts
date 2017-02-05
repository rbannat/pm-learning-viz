import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { CustomersBarchartComponent } from './shared/components/customers-barchart/customers-barchart.component';
import { ForcedGraphComponent } from './shared/components/forced-graph/forced-graph.component';
import { CustomersComponent } from './customers/customers.component';
import { IndexCasesComponent } from './index-cases/index-cases.component';
import { IndexCasesBarchartComponent } from './shared/components/index-cases-barchart/index-cases-barchart.component';
import { CustomersIcTableComponent } from './shared/components/customers-ic-table/customers-ic-table.component';
import { CustomerComponent } from './customer/customer.component';
import { CustomerMultiBarchartComponent } from './shared/components/customer-multi-barchart/customer-multi-barchart.component';
import { IndexCaseComponent } from './index-case/index-case.component';
import { UpdatesBarchartComponent } from './shared/components/updates-barchart/updates-barchart.component';
import { CirclePackingComponent } from './shared/components/circle-packing/circle-packing.component';

import { UpdateCaseService } from './shared/services/update-case.service';
import { ColorsService } from './shared/services/colors.service';
import { IndexCasesListComponent } from './shared/components/index-cases-list/index-cases-list.component';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    PageNotFoundComponent,
    CustomersBarchartComponent,
    ForcedGraphComponent,
    CustomersComponent,
    IndexCasesComponent,
    IndexCasesBarchartComponent,
    CustomersIcTableComponent,
    CustomerComponent,
    CustomerMultiBarchartComponent,
    IndexCaseComponent,
    UpdatesBarchartComponent,
    CirclePackingComponent,
    IndexCasesListComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpModule,
    MaterialModule.forRoot(),
    FlexLayoutModule.forRoot()
  ],
  providers: [UpdateCaseService, ColorsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
