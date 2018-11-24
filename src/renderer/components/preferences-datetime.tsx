import { MenuItem } from '@blueprintjs/core';
import { ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import React from 'react';
import moment from 'moment';

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

export const renderDateTimeItem: ItemRenderer<string> = (format, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
      return null;
  }

  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={format}
      onClick={handleClick}
      text={format}
      label={moment(EXAMPLE_TIME).format(format)}
    />
  );
};

export const filterDateTime: ItemPredicate<string> = (query, format) => {
  return format.toLowerCase().includes(query.toLowerCase());
};
