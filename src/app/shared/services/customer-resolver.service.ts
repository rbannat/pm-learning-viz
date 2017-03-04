import {Injectable}             from '@angular/core';
import {
  Router, Resolve, RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {DataService} from './data.service';

@Injectable()
export class CustomerResolver implements Resolve<number> {
  constructor(private us: DataService, private router: Router) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<number> {
    let id = +route.params['id'];
    return this.us.getCustomer(id).then(customer => {
      if (customer) {
        return customer;
      } else { // id not found
        this.router.navigate(['/customers']);
        return null;
      }
    });
  }
}
