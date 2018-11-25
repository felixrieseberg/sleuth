import { MenuItem } from '@blueprintjs/core';
import { ItemRenderer } from '@blueprintjs/select';
import React from 'react';

export interface Editor {
  name: string;
  cmd: string;
}

export const EDITORS = [
  { name: 'Visual Studio Code', cmd: `code --goto {filepath}:{line}` },
  { name: 'Sublime', cmd: `subl {filepath}:{line}` },
  { name: 'Atom', cmd: 'atom {filepath}:{line}' },
  { name: 'Custom', cmd: '' }
];

export function nameForCmd(input: string): string {
  const result = EDITORS.find(({ cmd }) => cmd === input);

  return result ? result.name : 'Custom';
}

export const renderEditorItem: ItemRenderer<Editor> = ({ name }, { handleClick, modifiers }) => {
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={name}
      onClick={handleClick}
      text={name}
    />
  );
};
