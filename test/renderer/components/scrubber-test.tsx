import * as React from 'react';
import { Scrubber } from '../../../src/renderer/components/scrubber';
import * as renderer from 'react-test-renderer';

it('scrubber renders correctly', () => {
  const tree = renderer.create(
    <Scrubber onResizeHandler={() => {}} elementSelector='window' />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});