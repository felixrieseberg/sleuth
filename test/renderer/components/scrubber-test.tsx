import React from 'react';
import { Scrubber } from '../../../src/renderer/components/scrubber';
import renderer from 'react-test-renderer';

it('scrubber renders correctly', () => {
  const tree = renderer.create(
    // tslint:disable-next-line:no-empty
    <Scrubber onResizeHandler={() => {}} elementSelector='window' />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});