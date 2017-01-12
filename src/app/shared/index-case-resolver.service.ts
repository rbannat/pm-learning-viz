import {Injectable}             from '@angular/core';
import {
  Router, Resolve, RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {UpdateCaseService} from './update-case.service';

@Injectable()
export class IndexCaseResolver implements Resolve<number> {
  constructor(private us: UpdateCaseService, private router: Router) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<number> {
    let id = +route.params['id'];
    return this.us.getIndexCase(id).then(indexCase => {
      if (indexCase) {
        return indexCase;
      } else { // id not found
        this.router.navigate(['/index-cases']);
        return null;
      }
    });
  }
}
