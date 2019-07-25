import { Routes } from '@angular/router';
import { HomeRoutes } from './home/home.routes';
import { NoPageRoutes } from './no-page/no-page.routes';

export const routes: Routes = [...HomeRoutes,  ...NoPageRoutes];
