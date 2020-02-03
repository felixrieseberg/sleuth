import React, { useState, useEffect } from 'react';
import { Tag } from '@blueprintjs/core';
import { format } from 'date-fns';

import { clipboard } from 'electron';

export interface TimestampProps {
  momentValue?: number;
  timestamp: string;
}

export function Timestamp(props: TimestampProps) {
  const { momentValue, timestamp } = props;
  const datetime = momentValue
      ? format(momentValue, 'eeee, MMMM do y, h:mm:ss a')
      : timestamp;
  const [ label, setLabel ] = useState(datetime);

  // On click, we'll write to the clipboard and update
  // the timestamp
  const onClick = () => {
    setLabel('Copied!');
    clipboard.writeText(datetime);
  };

  // One second after render, reset the label to the timestamp
  useEffect(() => {
    setTimeout(() => setLabel(datetime), 2000);
  });

  return (
    <Tag fill={true} large={true} icon='calendar' interactive={true} onClick={onClick}>
      {label}
    </Tag>
  );
}
