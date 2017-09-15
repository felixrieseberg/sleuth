import { observer } from 'mobx-react';
import { SleuthState } from '../state/sleuth';
import * as React from 'react';

export interface AlertProps {
  text: string;
  level?: 'error' | 'generic' | 'warning' | 'success' | 'info';
  state?: SleuthState;
}

export interface AlertState {}

@observer
export class Alert extends React.Component<AlertProps, AlertState> {
  constructor(props: AlertProps) {
    super(props);

    this.onclick = this.onclick.bind(this);
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

  public onclick() {
    if (this.props.state) {
      this.props.state.webAppLogsWarningDismissed = true;
    }
  }

  public render(): JSX.Element | null {
    if (this.props.state && this.props.state.webAppLogsWarningDismissed) return null;

    const { level, text } = this.props;
    const levelClassName = level === 'generic' ? '' : level;
    const icon = this.getIcon();

    return (
      <div onClick={this.onclick} className={`alert alert_${levelClassName}`}>
        {icon}
        {text}
      </div>
    );
  }
}
