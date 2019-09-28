import { MenuItem } from '@blueprintjs/core';
import { ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import React from 'react';
import { format } from 'date-fns';

export const EXAMPLE_TIME = 1493475035123;

export const DATE_TIME_FORMATS = [
  'HH:mm:ss (dd/MM)',
  'hh:mm:ss a (dd/MM)',
  'HH:mm:ss.SSS (dd/MM)',
  'hh:mm:ss.SSS a (dd/MM)',
  'hh:mm a, MMM do',
  'eeee, MMMM do y, h:mm:ss a',
  'eeee, ha'
];

export const renderDateTimeItem: ItemRenderer<string> = (input, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }

  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={input}
      onClick={handleClick}
      text={format}
      label={format(EXAMPLE_TIME, input)}
    />
  );
};

export const filterDateTime: ItemPredicate<string> = (query, input) => {
  return input.toLowerCase().includes(query.toLowerCase());
};
