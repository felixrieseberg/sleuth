import * as React from 'react';
import { Welcome } from '../../../src/renderer/components/welcome';
import * as renderer from 'react-test-renderer';

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
      <Welcome openFile={() => {}} />
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
})
