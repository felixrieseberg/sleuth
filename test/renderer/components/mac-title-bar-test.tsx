import React from 'react';
import { MacTitlebar } from '../../../src/renderer/components/mac-titlebar';
import renderer from 'react-test-renderer';

it('mac-titlebar renders correctly', () => {
  const tree = renderer.create(
    <MacTitlebar state={{} as any} />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});
