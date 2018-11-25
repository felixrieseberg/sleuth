import React from 'react';
import { Welcome } from '../../../src/renderer/components/welcome';
import renderer from 'react-test-renderer';

const mathBackup = global.Math;

describe('Welcome', () => {
  beforeAll(() => {
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.5;
    global.Math = mockMath;
  });

  afterAll(() => {
    global.Math = mathBackup;
  });

  it('welcome renders correctly', () => {
    const tree = renderer.create(
      // tslint:disable-next-line:no-empty
      <Welcome sleuth=':sleuth:' state={{} as any} />
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
