import * as React from 'react';
import * as classNames from 'classnames';

import { LogEntry, MergedLogFile, ProcessedLogFile } from '../interfaces';
import { DataView } from './dataview';
import { Alert } from './alert';
import { Column, Table, AutoSizer } from 'react-virtualized';

export interface RowClickEvent {
  index: number;
  rowData: any;
}

export interface LogTableProps {
  logFile: ProcessedLogFile | MergedLogFile;
}

export interface LogTableState {
  selectedEntry?: LogEntry;
  isDataViewVisible: boolean;
}

export class LogTable extends React.Component<LogTableProps, LogTableState> {
  private tableElement: Table;

  constructor(props: LogTableProps) {
    super(props);

    this.state = { isDataViewVisible: false };

    this.onRowClick = this.onRowClick.bind(this);
    this.messageCellRenderer = this.messageCellRenderer.bind(this);
    this.prefixTypeCellRenderer = this.prefixTypeCellRenderer.bind(this);
    this.toggleDataView = this.toggleDataView.bind(this);
  }

  private readonly refHandlers = {
    table: (ref: Table) => this.tableElement = ref,
  };

  /**
   * Handles a single click onto a row
   *
   * @param {RowClickEvent} { index }
   */
  public onRowClick({ index }: RowClickEvent) {
    const selectedEntry = this.props.logFile.logEntries[index] || null;
    const isDataViewVisible = !!selectedEntry.meta;
    this.setState({ selectedEntry, isDataViewVisible });
  }

  /**
   * Renders the "message" cell
   *
   * @param {any} { cellData, columnData, dataKey, rowData, rowIndex }
   * @returns {(JSX.Element | string)}
   */
  public messageCellRenderer({ cellData, columnData, dataKey, rowData, rowIndex }): JSX.Element | string {
    if (rowData.meta) {
      return (<span><i className='ts_icon ts_icon_all_files_alt HasData'/> {cellData}</span>);
    } else {
      return String(cellData);
    }
  }

  /**
   * Renders a cell, prefixing the log entries type.
   *
   * @param {any} { cellData, columnData, dataKey, rowData, rowIndex }
   * @returns {JSX.Element}
   */
  public prefixTypeCellRenderer({ cellData, columnData, dataKey, rowData, rowIndex }): JSX.Element | String {
    let prefix = <i className='Meta ts_icon ts_icon_question'/>;

    if ((rowData as LogEntry).logType === 'browser') {
      prefix = <i title='Browser Log' className='Meta Color-Browser ts_icon ts_icon_power_off'/>;
    } else if ((rowData as LogEntry).logType === 'renderer') {
      prefix = <i title='Renderer Log' className='Meta Color-Renderer ts_icon ts_icon_laptop'/>;
    } else if ((rowData as LogEntry).logType === 'webapp') {
      prefix = <i title='Webapp Log' className='Meta Color-Webapp ts_icon ts_icon_globe'/>;
    } else if ((rowData as LogEntry).logType === 'webview') {
      prefix = <i title='Webview Log' className='Meta Color-Webview ts_icon ts_icon_all_files_alt'/>;
    }

    return (<span>{prefix}{cellData}</span>);
  }

  /**
   * Toggles the data view
   */
  public toggleDataView() {
    this.setState({ isDataViewVisible: !this.state.isDataViewVisible });
  }

  /**
   * Checks if we're looking at a web app log and returns a warning, so that users know
   * the app didn't all over
   *
   * @returns {(JSX.Element | null)}
   */
  public renderWebAppWarning(): JSX.Element | null {
    const { logFile } = this.props;

    const text = `The web app logs are difficult to parse for a computer - proceed with caution.`;
    return logFile.logType === 'webapp' ? <Alert text={text} level='warning' /> : null;
  }

  public render(): JSX.Element {
    const { logFile } = this.props;
    const { isDataViewVisible, selectedEntry } = this.state;
    const { logEntries } = logFile;
    const typeClassName = logFile.type === 'MergedLogFile' ? 'Merged' : 'Single';
    const className = classNames('LogTable', typeClassName, { Collapsed: isDataViewVisible });
    const warning = this.renderWebAppWarning();
    const tableOptions = {
      headerHeight: 20,
      rowHeight: 30,
      rowGetter: (r: any) => logEntries[r.index],
      rowCount: logEntries.length,
      onRowClick: (event: RowClickEvent) => this.onRowClick(event),
      ref: this.refHandlers.table,
      overscanRowCount: 200
    };

    return (
      <div>
        <div className={className}>
          {warning}
          <AutoSizer>
            {({ width, height }) => (
              <Table {...tableOptions} height={height} width={width}>
                <Column width={190} label='Timestamp' dataKey='timestamp' cellRenderer={this.prefixTypeCellRenderer} />
                <Column width={70} label='Level' dataKey='level' />
                <Column width={200} label='Message' dataKey='message' flexGrow={1} cellRenderer={this.messageCellRenderer} />
              </Table>
            )}
          </AutoSizer>
        </div>
        <DataView isVisible={isDataViewVisible} entry={selectedEntry} toggle={this.toggleDataView} logEntry={selectedEntry} />
      </div>
    );
  }
}
