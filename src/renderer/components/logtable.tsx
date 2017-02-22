import * as React from 'react';
import * as classNames from 'classnames';

import { LogEntry, ProcessedLogFile } from './logview';
import { DataView } from './dataview';
import { Column, Table, AutoSizer } from 'react-virtualized';

export interface RowClickEvent {
  index: number;
  rowData: any;
}

export interface LogTableProps {
  logFile: ProcessedLogFile;
}

export interface LogTableState {
  selectedEntry?: LogEntry;
  isDataViewVisible: boolean;
}

export class LogTable extends React.Component<LogTableProps, LogTableState> {
  constructor(props: LogTableProps) {
    super(props);

    this.state = { isDataViewVisible: false };

    this.onRowClick = this.onRowClick.bind(this);
    this.cellRenderer = this.cellRenderer.bind(this);
    this.toggleDataView = this.toggleDataView.bind(this);
  }

  public onRowClick({ index }: RowClickEvent) {
    const selectedEntry = this.props.logFile.logEntries[index] || null;
    this.setState({ selectedEntry, isDataViewVisible: true })
  }

  public cellRenderer({ cellData, columnData, dataKey, rowData, rowIndex }) {
    if (rowData.meta) {
      return (<span><i className='ts_icon ts_icon_all_files_alt HasData'/> {cellData}</span>);
    } else {
      return String(cellData);
    }
  }

  public toggleDataView() {
    this.setState({ isDataViewVisible: !this.state.isDataViewVisible });
  }

  public render() {
    const { logFile } = this.props;
    const { isDataViewVisible, selectedEntry } = this.state;
    const { logEntries } = logFile;
    const className = classNames('LogTable', { Collapsed: isDataViewVisible })
    const tableOptions = {
      ref: 'Table',
      headerHeight: 20,
      rowHeight: 30,
      rowGetter: (r: any) => logEntries[r.index],
      rowCount: logEntries.length,
      onRowClick: (event: RowClickEvent) => this.onRowClick(event)
    };

    return (
      <div>
        <div className={className}>
          <AutoSizer>
            {({ width, height }) => (
              <Table {...tableOptions} height={height} width={width}>
                <Column width={150} label="Timestamp" dataKey="timestamp" />
                <Column width={70} label="Level" dataKey="level" />
                <Column width={200} label="Message" dataKey="message" flexGrow={1} cellRenderer={this.cellRenderer}/>
              </Table>
            )}
          </AutoSizer>
        </div>
        <DataView isVisible={isDataViewVisible} entry={selectedEntry} toggle={this.toggleDataView} />
      </div>
    );
  }
}
