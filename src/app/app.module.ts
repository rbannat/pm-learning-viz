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


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    PageNotFoundComponent,
    CustomersBarchartComponent,
    ForcedGraphComponent,
    CustomersComponent,
    IndexCasesComponent,
    IndexCasesBarchartComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpModule,
    MaterialModule.forRoot(),
    FlexLayoutModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
