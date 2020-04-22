import React, { useState, useEffect } from 'react';
import { Tag } from '@blueprintjs/core';
import { format, formatDistance } from 'date-fns';

import { clipboard } from 'electron';

export interface TimestampProps {
  momentValues: Array<number>;
  timestamps: Array<string>;
}

export function Timestamp(props: TimestampProps) {
  const { momentValues, timestamps } = props;
  const datetime = getDateTime(momentValues, timestamps);
  const [ label, setLabel ] = useState(datetime);

  // On click, we'll write to the clipboard and update
  // the timestamp
  const onClick = () => {
    setLabel('Copied!');
    clipboard.writeText(datetime);
    setTimeout(() => setLabel(datetime), 2000);
  };

  useEffect(() => {
    setLabel(datetime);
  }, [ momentValues, timestamps ]);

  return (
    <Tag fill={true} large={true} icon='calendar' interactive={true} onClick={onClick}>
      {label}
    </Tag>
  );
}

function getDateTime(momentValues: Array<number>, timestamps: Array<string>) {
  // We have momentValues
  if (momentValues.length === 1) {
    return format(momentValues[0], 'eeee, MMMM do y, h:mm:ss a');
  } else if (momentValues.length > 1) {
    const start = momentValues[0];
    const end = momentValues[momentValues.length - 1];
    const distance = formatDistance(start, end, { includeSeconds: true });
    const startFormatted = format(start, 'M/d, h:mm:ss a');

    return `${startFormatted} and ${distance}`;
  }

  // Just timestamps
  if (timestamps.length === 1) {
    return timestamps[0];
  } else if (timestamps.length > 1) {
    return `Starting at ${timestamps[0]}`;
  }

  return '';
}
