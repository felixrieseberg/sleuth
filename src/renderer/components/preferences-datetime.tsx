import { MenuItem } from '@blueprintjs/core';
import { ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import React from 'react';
import { format } from 'date-fns';

export const EXAMPLE_TIME = 1493475035123;

export const DATE_TIME_FORMATS = [
  'HH:mm:ss (DD/MM)',
  'hh:mm:ss A (DD/MM)',
  'HH:mm:ss.SSS (DD/MM)',
  'hh:mm:ss.SSS A (DD/MM)',
  'hh:mm A, MMM Do',
  'dddd, MMMM Do YYYY, h:mm:ss a',
  'ddd, hA'
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
