import { observable } from 'mobx';

export class SleuthState {
    @observable public isCooperSignedIn = false;
}

export const sleuthState = new SleuthState();
