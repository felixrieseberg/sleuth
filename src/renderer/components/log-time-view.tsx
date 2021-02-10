import { SleuthState } from "../state/sleuth";
import { observer } from "mobx-react";
import React from "react";
import { ProcessedLogFile } from "../../interfaces";
import { Bar } from "react-chartjs-2";
import moment from "moment";

const { Chart } = require("react-chartjs-2");
Chart.plugins.register(require("chartjs-plugin-zoom"));

export interface LogTimeViewProps {
  state: SleuthState;
  isVisible: boolean;
  logFile: ProcessedLogFile;
  height: number;
  navigateTableTo?: (t: moment.Moment) => void;
}

export interface LogTimeViewState {
  range: number;
}

@observer
export class LogTimeView extends React.Component<
  LogTimeViewProps,
  LogTimeViewState
> {
  constructor(props: LogTimeViewProps) {
    super(props);

    this.state = {
      range: this.getInitialRange(props),
    };
    this.onChartClick = this.onChartClick.bind(this);
    this.onZoom = this.onZoom.bind(this);
  }

  componentWillReceiveProps(newProps: LogTimeViewProps) {
    this.setState({
      range: this.getInitialRange(newProps),
    });
  }

  private getInitialRange(props: LogTimeViewProps) {
    let min = Number.MAX_SAFE_INTEGER;
    let max = 0;
    for (const entry of props.logFile.logEntries) {
      if (entry.momentValue! < min) {
        min = entry.momentValue!;
      }
      if (entry.momentValue! > max) {
        max = entry.momentValue!;
      }
    }
    return max - min;
  }

  private onChartClick(chartElements: any[], e: any) {
    if (!chartElements || !chartElements.length) return;

    const [elem] = chartElements;
    const chart = elem._chart;

    const canvasPosition = elem.getCenterPoint();

    const dataX = moment(
      chart.scales["x-axis-0"].getValueForPixel(canvasPosition.x)
    );
    // TODO: Navigate to this time in the table
    if (this.props.navigateTableTo) this.props.navigateTableTo(dataX);
  }

  private onZoom({ chart }: any) {
    const from = chart.options.scales.xAxes[0].ticks.min;
    const until = chart.options.scales.xAxes[0].ticks.max;
    this.setState({
      range: until - from,
    });
  }

  public render(): JSX.Element | null {
    if (!this.props.isVisible) return null;

    const getBucket = (m: moment.Moment): number => {
      if (this.state.range < 1000 * 60 * 60 * 4) {
        return m.startOf("minute").unix();
      } else if (this.state.range < 1000 * 60 * 60 * 8) {
        const r = 30 - (m.minute() % 15);
        return m.add(r, "minute").seconds(0).milliseconds(0).unix();
      } else if (this.state.range < 1000 * 60 * 60 * 24) {
        const r = 30 - (m.minute() % 30);
        return m.add(r, "minute").seconds(0).milliseconds(0).unix();
      }
      return m.startOf("hour").unix();
    };

    const values: Record<number, any> = {};
    for (const entry of this.props.logFile.logEntries) {
      const hour = getBucket(moment(entry.momentValue));
      values[hour] = values[hour] || { info: 0, warn: 0, error: 0, debug: 0 };
      values[hour][entry.level]++;
    }
    const entries = Object.entries(values);

    return (
      <div style={{ position: "relative", height: this.props.height }}>
        <Bar
          key={this.props.logFile.id}
          data={{
            datasets: [
              {
                label: "Info",
                data: entries.map((e) => ({
                  y: e[1].info,
                  t: moment(parseInt(e[0], 10) * 1000).toDate(),
                })),
                backgroundColor: "#7FD1E0",
              },
              {
                label: "Warning",
                data: entries.map((e) => ({
                  y: e[1].warn,
                  t: moment(parseInt(e[0], 10) * 1000).toDate(),
                })),
                backgroundColor: "#F8B82C",
              },
              {
                label: "Error",
                data: entries.map((e) => ({
                  y: e[1].error,
                  t: moment(parseInt(e[0], 10) * 1000).toDate(),
                })),
                backgroundColor: "#e32072",
              },
              {
                label: "Debug",
                data: entries.map((e) => ({
                  y: e[1].debug,
                  t: moment(parseInt(e[0], 10) * 1000).toDate(),
                })),
              },
            ],
          }}
          options={
            {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                xAxes: [
                  {
                    stacked: true,
                    type: "time",
                    time: {
                      unit: "hour",
                    },
                  },
                ],
                yAxes: [
                  {
                    stacked: true,
                  },
                ],
              },
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                enabled: true,
                mode: "x",
                onZoom: this.onZoom,
              },
            } as any
          }
          onElementsClick={this.onChartClick as any}
        />
      </div>
    );
  }
}
