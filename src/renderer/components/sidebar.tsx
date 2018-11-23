import React from 'react';
import classNames from 'classnames';
import isEqual from 'react-fast-compare';
import { ITreeNode, Tree, Icon, Position, Tooltip, Intent } from '@blueprintjs/core';
import { observer } from 'mobx-react';

import { UnzippedFile } from '../unzip';
import { MergedFilesLoadStatus, ProcessedLogFile, ProcessedLogFiles } from '../interfaces';
import { levelsHave } from '../../utils/levelcounts';
import { SleuthState } from '../state/sleuth';

export interface SidebarProps {
  logFiles: ProcessedLogFiles;
  isOpen: boolean;
  selectedLogFileName: string;
  selectLogFile: (logFile: ProcessedLogFile | UnzippedFile | null, logType?: string) => void;
  mergedFilesStatus: MergedFilesLoadStatus;
  state: SleuthState;
}

export interface SidebarState {
  nodes: Array<ITreeNode>;
}

const DEFAULT_NODES: Array<ITreeNode> = [
  {
    id: 'all-desktop',
    hasCaret: false,
    label: 'All Desktop Logs',
    icon: 'compressed',
    nodeData: { type: 'all' }
  },
  {
    id: 0,
    hasCaret: true,
    icon: 'cog',
    label: 'State & Settings',
    isExpanded: true,
    childNodes: [],
  },
  {
    id: 1,
    hasCaret: true,
    icon: 'application',
    label: 'Browser Process',
    isExpanded: true,
    childNodes: [],
    nodeData: { type: 'browser' }
  },
  {
    id: 2,
    hasCaret: true,
    icon: 'applications',
    label: 'Renderer Process',
    isExpanded: true,
    childNodes: [],
    nodeData: { type: 'renderer' }
  },
  {
    id: 3,
    hasCaret: true,
    icon: 'applications',
    label: 'BrowserView Process',
    isExpanded: true,
    childNodes: [],
    nodeData: { type: 'preload' }
  },
  {
    id: 4,
    hasCaret: true,
    icon: 'chat',
    label: 'WebApp',
    isExpanded: true,
    childNodes: [],
  },
  {
    id: 5,
    hasCaret: true,
    icon: 'phone',
    label: 'Calls',
    isExpanded: true,
    childNodes: [],
  }
];

@observer
export class Sidebar extends React.Component<SidebarProps, SidebarState> {
  public static getDerivedStateFromProps(props: SidebarProps, state: SidebarState) {
    const { logFiles } = props;
    const nodes = state.nodes;

    nodes[1].childNodes = logFiles.state.map((file) => Sidebar.getStateFileNode(file, props));
    nodes[2].childNodes = logFiles.browser.map((file) => Sidebar.getFileNode(file, props));
    nodes[3].childNodes = logFiles.renderer.map((file) => Sidebar.getFileNode(file, props));
    nodes[4].childNodes = logFiles.preload.map((file) => Sidebar.getFileNode(file, props));
    nodes[5].childNodes = logFiles.webapp.map((file) => Sidebar.getFileNode(file, props));
    nodes[6].childNodes = logFiles.call.map((file) => Sidebar.getFileNode(file, props));

    return {
      nodes
    };
  }

  public static getFileNode(file: ProcessedLogFile | UnzippedFile, props: SidebarProps): ITreeNode {
    if ((file as ProcessedLogFile).type === 'ProcessedLogFile') {
      // It's a log file
      return Sidebar.getLogFileNode(file as ProcessedLogFile, props);
    } else {
      // it's a state file
      return Sidebar.getStateFileNode(file as UnzippedFile, props);
    }
  }

  public static getNode(
    id: string, nodeData: any, isSelected: boolean, options: Partial<ITreeNode> = {}
  ): ITreeNode {
    return {
      id,
      label: id,
      isSelected,
      nodeData,
      icon: 'document',
      ...options
    };
  }

  public static getStateFileNode(file: UnzippedFile, props: SidebarProps): ITreeNode {
    const {  selectedLogFileName } = props;
    const isSelected = (selectedLogFileName === file.fileName);

    let label;
    if (file.fileName.endsWith('gpu-log.html')) {
      label = 'GPU';
    } else if (file.fileName.endsWith('notification-warnings.json')) {
      label = 'notification warnings';
    } else {
      const nameMatch = file.fileName.match(/slack-(\w*)/);
      label = nameMatch && nameMatch.length > 1 ? nameMatch[1] : file.fileName;
    }

    return Sidebar.getNode(label, { file }, isSelected);
  }

  public static getLogFileNode(file: ProcessedLogFile, props: SidebarProps): ITreeNode {
    const { selectedLogFileName } = props;
    const isSelected = (selectedLogFileName === file.logFile.fileName);
    const options: Partial<ITreeNode> = { secondaryLabel: this.getNodeHint(file) };

    return Sidebar.getNode(file.logFile.fileName, { file }, isSelected, options);
  }

  public static getNodeHint(file: ProcessedLogFile): JSX.Element | null {
    const { levelCounts } = file;

    if (!levelsHave('error', levelCounts)) return null;

    let content = `This file contains ${levelCounts.error} errors`;

    if (levelsHave('warn', levelCounts)) {
      content += ` and ${levelCounts.warn} warnings.`;
    } else {
      content += `.`;
    }

    return (
      <Tooltip content={content} position={Position.RIGHT} boundary='viewport'>
        <Icon icon='error' intent={Intent.WARNING} />
      </Tooltip>
    );
  }

  constructor(props: SidebarProps) {
    super(props);

    this.state = {
      nodes: DEFAULT_NODES
    };

    this.forEachNode = this.forEachNode.bind(this);
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleNodeCollapse = this.handleNodeCollapse.bind(this);
    this.handleNodeExpand = this.handleNodeExpand.bind(this);
  }

  public shouldComponentUpdate(nextProps: SidebarProps, nextState: SidebarState) {
    return isEqual(this.state, nextState) || isEqual(this.props, nextProps);
  }

  public getLogFileNames(logFiles: ProcessedLogFiles) {
    const getNames = (ob: Array<ProcessedLogFile>) => {
      return ob.map((l) => l && l.logFile && l.logFile.fileName ? l.logFile.fileName : null)
        .filter((e) => e);
    };

    if (!logFiles) {
      return {
        browser: [],
        renderer: [],
        webapp: [],
        preload: [],
        call: []
      };
    }

    return {
      browser: getNames(logFiles.browser),
      renderer: getNames(logFiles.renderer),
      webapp: getNames(logFiles.webapp),
      preload: getNames(logFiles.preload),
      call: getNames(logFiles.call)
    };
  }

  public forEachNode(nodes: Array<ITreeNode>, callback: (node: ITreeNode) => void) {
    for (const node of nodes) {
      callback(node);

      if (node.childNodes) {
        this.forEachNode(node.childNodes, callback);
      }
    }
  }

  public handleNodeClick(node: ITreeNode, _nodePath: Array<number>, _e: React.MouseEvent<HTMLElement>) {
    const nodeData: any = node.nodeData;

    if (nodeData && nodeData.file) {
      this.props.selectLogFile(nodeData.file);
    }

    if (nodeData && nodeData.type) {
      this.props.selectLogFile(null, nodeData.type);
    }

    if (nodeData) {
      this.forEachNode(this.state.nodes, (n) => (n.isSelected = false));
      node.isSelected = true;

      this.setState(this.state);
    }
  }

  public handleNodeCollapse(nodeData: ITreeNode) {
    nodeData.isExpanded = false;
    this.setState(this.state);
  }

  public handleNodeExpand(nodeData: ITreeNode) {
    nodeData.isExpanded = true;
    this.setState(this.state);
  }

  public render(): JSX.Element {
    const { isOpen } = this.props;
    const className = classNames('Sidebar', { isOpen });

    return (
      <div className={className}>
        <Tree
          contents={this.state.nodes}
          onNodeClick={this.handleNodeClick}
          onNodeCollapse={this.handleNodeCollapse}
          onNodeExpand={this.handleNodeExpand}
        />
      </div>
    );
  }
}
