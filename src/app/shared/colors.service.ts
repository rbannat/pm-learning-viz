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

  private hexColors: any =
    {
      'ACTION_REQUEST': '#FFC107',
      'COMPLAINT': '#E91E63',
      'INFO_REQUEST': '#009688',
      'PRAISE': '#2196F3',
      'PROVIDE_INFO': '#03A9F4',
      'UNKNOWN': '#9E9E9E'
    };

  constructor() {}

  getColor(action_type:string):string {
    return (this.colors[action_type]) ? this.colors[action_type] : 'unknown';
  }

  getHexColor(action_type:string):string {
    return (this.hexColors[action_type]) ? this.hexColors[action_type] : '#333';
  }

}
