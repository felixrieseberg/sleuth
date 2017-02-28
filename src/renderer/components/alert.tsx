import * as React from 'react';

export interface AlertProps {
  text: string;
  level?: 'error' | 'generic' | 'warning' | 'success' | 'info';
}

export class Alert extends React.Component<AlertProps, undefined> {
  constructor() {
    super();
  }

  public getIcon() {
    const { level } = this.props;
    let icon = 'ts_icon_slack_pillow';

    if (level === 'warning' || level === 'error') {
      icon = 'ts_icon_warning';
    } else if (level === 'success') {
      icon = 'ts_icon_check_circle_o';
    } else if (level === 'info') {
      icon = 'ts_icon_info_circle';
    }

    return <i className={`ts_icon ${icon}`} />;
  }

  public render() {
    const { level, text } = this.props;
    const levelClassName = level === 'generic' ? '' : level;
    const icon = this.getIcon();

    return (
      <div className={`alert alert_${levelClassName}`}>
        {icon}
        {text}
      </div>
    );
  }
}
