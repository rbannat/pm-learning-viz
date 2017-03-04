import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout/flexbox';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { HorizontalBarChartComponent } from './shared/components/horizontal-bar-chart/horizontal-bar-chart.component';
import { NodeGraphComponent } from './shared/components/node-graph/node-graph.component';
import { CustomersComponent } from './customers/customers.component';
import { IndexCasesComponent } from './index-cases/index-cases.component';
import { IndexCasesBarchartComponent } from './shared/components/index-cases-barchart/index-cases-barchart.component';
import { HeatmapMatrixComponent } from './shared/components/heatmap-matrix/heatmap-matrix.component';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { MultiBarChartComponent } from './shared/components/multi-bar-chart/multi-bar-chart.component';
import { IndexCaseDetailComponent } from './index-case-detail/index-case-detail.component';
import { BarChartComponent } from './shared/components/bar-chart/bar-chart.component';
import { CirclePackingChartComponent } from './shared/components/circle-packing-chart/circle-packing-chart.component';

import { DataService } from './shared/services/data.service';
import { FilterService } from './shared/services/filter.service';
import { ColorsService } from './shared/services/colors.service';
import { IndexCasesListComponent } from './shared/components/index-cases-list/index-cases-list.component';
import { FilterComponent } from './shared/components/filter/filter.component';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    PageNotFoundComponent,
    HorizontalBarChartComponent,
    NodeGraphComponent,
    CustomersComponent,
    IndexCasesComponent,
    IndexCasesBarchartComponent,
    HeatmapMatrixComponent,
    CustomerDetailComponent,
    MultiBarChartComponent,
    IndexCaseDetailComponent,
    BarChartComponent,
    CirclePackingChartComponent,
    IndexCasesListComponent,
    FilterComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpModule,
    MaterialModule,
    FlexLayoutModule
  ],
  providers: [DataService, ColorsService, FilterService],
  bootstrap: [AppComponent]
})
export class AppModule { }
