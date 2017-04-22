import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { Alert } from '../../../src/renderer/components/alert';
import { shallow } from 'enzyme';

describe('Alert', () => {
  it('alert renders correctly (default)', () => {
    const tree = renderer.create(<Alert text='Hello' />).toJSON();
    expect(tree).toMatchSnapshot('alert-default');
  });

  it('alert renders correctly (warning)', () => {
    const tree = renderer.create(<Alert text='Hello' level='warning'/>).toJSON();
    expect(tree).toMatchSnapshot('alert-warning');
  });

  it('alert renders correctly (error)', () => {
    const tree = renderer.create(<Alert text='Hello' level='error'/>).toJSON();
    expect(tree).toMatchSnapshot('alert-error');
  });

  it('alert renders correctly (success)', () => {
    const tree = renderer.create(<Alert text='Hello' level='success'/>).toJSON();
    expect(tree).toMatchSnapshot('alert-success');
  });

  it('alert renders correctly (info)', () => {
    const tree = renderer.create(<Alert text='Hello' level='info'/>).toJSON();
    expect(tree).toMatchSnapshot('alert-info');
  });

  it('can be dismissed', () => {
    const fakeAlertState: any = {
      webAppLogsWarningDismissed: false
    };

    const alert = shallow(<Alert text='Hello' state={fakeAlertState} />);
    alert.find('div').simulate('click');

    expect(fakeAlertState.webAppLogsWarningDismissed).toBeTruthy();
  });
});
