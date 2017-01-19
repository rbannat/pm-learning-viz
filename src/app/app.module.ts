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
import { CustomersBarchartComponent } from './shared/customers-barchart/customers-barchart.component';
import { ForcedGraphComponent } from './shared/forced-graph/forced-graph.component';
import { CustomersComponent } from './customers/customers.component';
import { IndexCasesComponent } from './index-cases/index-cases.component';
import { IndexCasesBarchartComponent } from './shared/index-cases-barchart/index-cases-barchart.component';
import { CustomersIcTableComponent } from './shared/customers-ic-table/customers-ic-table.component';
import { CustomerComponent } from './customer/customer.component';
import { CustomerMultiBarchartComponent } from './shared/customer-multi-barchart/customer-multi-barchart.component';
import { IndexCaseComponent } from './index-case/index-case.component';
import { UpdatesBarchartComponent } from './shared/updates-barchart/updates-barchart.component';
import { CirclePackingComponent } from './shared/circle-packing/circle-packing.component';

import { UpdateCaseService } from './shared/update-case.service';
import { ColorsService } from './shared/colors.service';


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
    CirclePackingComponent
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
