import {Injectable} from '@angular/core';

@Injectable()
export class ColorsService {

  private colors: any =
    {
      'ACTION_REQUEST': 'action-request',
      'COMPLAINT': 'complaint',
      'INFO_REQUEST': 'info-request',
      'PRAISE': 'praise',
      'PROVIDE_INFO': 'provide-info',
      'UNKNOWN': 'unknown'
    };

  constructor() {}

  getColor(action_type:string):string {
    return (this.colors[action_type]) ? this.colors[action_type] : 'unknown';
  }

}
