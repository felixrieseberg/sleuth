import React from 'react';
import classNames from 'classnames';
import { ITreeNode, Tree, Icon, Position, Tooltip, Intent } from '@blueprintjs/core';
import { observer } from 'mobx-react';

import { MergedFilesLoadStatus, ProcessedLogFile, UnzippedFile } from '../../interfaces';
import { levelsHave } from '../../utils/level-counts';
import { SleuthState } from '../state/sleuth';
import { isProcessedLogFile } from '../../utils/is-logfile';
import { countExcessiveRepeats } from '../../utils/count-excessive-repeats';
import { plural } from '../../utils/pluralize';
import { getRootStateWarnings } from '../analytics/root-state-analytics';

export interface SidebarProps {
  selectedLogFileName: string;
  mergedFilesStatus: MergedFilesLoadStatus;
  state: SleuthState;
}

export interface SidebarState {
  nodes: Array<ITreeNode>;
}

const enum NODE_ID {
  ALL = 'all-desktop',
  STATE = 'state',
  BROWSER = 'browser',
  RENDERER = 'renderer',
  PRELOAD = 'preload',
  WEBAPP = 'webapp',
  CALLS = 'calls',
  INSTALLER = 'installer',
  NETWORK = 'network',
  CACHE = 'cache',
  MOBILE = 'mobile'
}

const DEFAULT_NODES: Array<ITreeNode> = [
  {
    id: NODE_ID.STATE,
    hasCaret: true,
    icon: 'cog',
    label: 'State & Settings',
    isExpanded: true,
    childNodes: [],
  }, {
    id: NODE_ID.ALL,
    hasCaret: false,
    label: 'All Desktop Logs',
    icon: 'compressed',
    nodeData: { type: 'all' }
  }, {
    id: NODE_ID.BROWSER,
    hasCaret: true,
    icon: 'application',
    label: 'Browser Process',
    isExpanded: true,
    childNodes: [],
    nodeData: { type: 'browser' }
  }, {
    id: 'renderer',
    hasCaret: true,
    icon: 'applications',
    label: 'Renderer Process',
    isExpanded: true,
    childNodes: [],
    nodeData: { type: 'renderer' }
  }, {
    id: NODE_ID.PRELOAD,
    hasCaret: true,
    icon: 'applications',
    label: 'BrowserView Process',
    isExpanded: true,
    childNodes: [],
    nodeData: { type: 'preload' },
  }, {
    id: NODE_ID.WEBAPP,
    hasCaret: true,
    icon: 'chat',
    label: 'WebApp',
    isExpanded: true,
    childNodes: [],
    nodeData: { type: 'webapp' }
  }, {
    id: NODE_ID.CALLS,
    hasCaret: true,
    icon: 'phone',
    label: 'Calls',
    isExpanded: true,
    childNodes: [],
  }, {
    id: NODE_ID.INSTALLER,
    hasCaret: true,
    icon: 'automatic-updates',
    label: 'Installer',
    isExpanded: true,
    childNodes: [],
  }, {
    id: NODE_ID.NETWORK,
    hasCaret: true,
    icon: 'feed',
    label: 'Network',
    isExpanded: true,
    childNodes: [],
  }, {
    id: NODE_ID.CACHE,
    hasCaret: false,
    icon: 'projects',
    label: 'Cache',
    nodeData: { type: 'cache' }
  }, {
    id: NODE_ID.MOBILE,
    hasCaret: false,
    icon: 'mobile-phone',
    label: 'Mobile',
  isExpanded: true  }
];

@observer
export class Sidebar extends React.Component<SidebarProps, SidebarState> {
  public static getDerivedStateFromProps(props: SidebarProps, state: SidebarState) {
    const { processedLogFiles } = props.state;

    if (!processedLogFiles) return {};

    Sidebar.setChildNodes(NODE_ID.STATE, state, processedLogFiles.state.map((file) => Sidebar.getStateFileNode(file, props)));
    Sidebar.setChildNodes(NODE_ID.BROWSER, state, processedLogFiles.browser.map((file) => Sidebar.getFileNode(file, props)));
    Sidebar.setChildNodes(NODE_ID.RENDERER, state, processedLogFiles.renderer.map((file) => Sidebar.getFileNode(file, props)));
    Sidebar.setChildNodes(NODE_ID.PRELOAD, state, processedLogFiles.preload.map((file) => Sidebar.getFileNode(file, props)));
    Sidebar.setChildNodes(NODE_ID.WEBAPP, state, processedLogFiles.webapp.map((file) => Sidebar.getFileNode(file, props)));
    Sidebar.setChildNodes(NODE_ID.CALLS, state, processedLogFiles.call.map((file) => Sidebar.getFileNode(file, props)));
    Sidebar.setChildNodes(NODE_ID.INSTALLER, state, processedLogFiles.installer.map((file) => Sidebar.getInstallerFileNode(file, props)));
    Sidebar.setChildNodes(NODE_ID.NETWORK, state, processedLogFiles.netlog.map((file, i) => Sidebar.getNetlogFileNode(file, props, i)));
    Sidebar.setChildNodes(NODE_ID.MOBILE, state, processedLogFiles.mobile.map((file) => Sidebar.getFileNode(file, props)));


    return { nodes: state.nodes };
  }

  /**
   * Returns a generic tree node, given all the parameters.
   *
   * @static
   * @param {string} id
   * @param {*} nodeData
   * @param {boolean} isSelected
   * @param {Partial<ITreeNode>} [options={}]
   * @returns {ITreeNode}
   */
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

  /**
   * Get a single tree node for a file.
   *
   * @static
   * @param {(ProcessedLogFile | UnzippedFile)} file
   * @param {SidebarProps} props
   * @returns {ITreeNode}
   */
  public static getFileNode(file: ProcessedLogFile | UnzippedFile, props: SidebarProps): ITreeNode {
    return isProcessedLogFile(file)
      ? Sidebar.getLogFileNode(file as ProcessedLogFile, props)
      : Sidebar.getStateFileNode(file as UnzippedFile, props);
  }

  /**
   * Returns a single tree node for an UnzippedFile (which are state files).
   *
   * @static
   * @param {UnzippedFile} file
   * @param {SidebarProps} props
   * @returns {ITreeNode}
   */
  public static getStateFileNode(file: UnzippedFile, props: SidebarProps): ITreeNode {
    const { selectedLogFileName } = props;
    const isSelected = (selectedLogFileName === file.fileName);

    let label;
    if (file.fileName.endsWith('gpu-log.html')) {
      label = 'GPU';
    } else if (file.fileName.endsWith('notification-warnings.json')) {
      label = 'Notification Warnings';
    } else if (file.fileName.endsWith('environment.json')) {
      label = 'Environment';
    } else if (file.fileName.endsWith('local-settings.json')) {
      label = 'Local Settings';
    } else {
      const nameMatch = file.fileName.match(/slack-(\w*)/);
      label = nameMatch && nameMatch.length > 1 ? nameMatch[1] : file.fileName;
    }

    const options: Partial<ITreeNode> = { secondaryLabel: this.getStateFileHint(file) };

    return Sidebar.getNode(label, { file }, isSelected, options);
  }

  /**
   * Returns a single tree node for an UnzippedFile (in this case, net logs).
   *
   * @static
   * @param {UnzippedFile} file
   * @param {SidebarProps} props
   * @param {number} index
   * @returns {ITreeNode}
   */
  public static getNetlogFileNode(file: UnzippedFile, props: SidebarProps, i: number): ITreeNode {
    const {  selectedLogFileName } = props;
    const isSelected = (selectedLogFileName === file.fileName);

    return Sidebar.getNode(`Net Log ${i + 1}`, { file }, isSelected);
  }

  /**
   * Returns a single tree node for an UnzippedFile (in this case, net logs).
   *
   * @static
   * @param {UnzippedFile} file
   * @param {SidebarProps} props
   * @returns {ITreeNode}
   */
  public static getInstallerFileNode(
    file: UnzippedFile | ProcessedLogFile, props: SidebarProps
  ): ITreeNode {
    const {  selectedLogFileName } = props;
    const name = isProcessedLogFile(file) ? file.logFile.fileName : file.fileName;
    const isSelected = (selectedLogFileName === name);

    return Sidebar.getNode(name, { file }, isSelected);
  }

  /**
   * Returns a single tree node for a ProcessedLogFile (all log files, not state files).
   *
   * @static
   * @param {ProcessedLogFile} file
   * @param {SidebarProps} props
   * @returns {ITreeNode}
   */
  public static getLogFileNode(file: ProcessedLogFile, props: SidebarProps): ITreeNode {
    const { selectedLogFileName } = props;
    const isSelected = (selectedLogFileName === file.logFile.fileName);
    const options: Partial<ITreeNode> = { secondaryLabel: this.getLogNodeHint(file) };

    return Sidebar.getNode(file.logFile.fileName, { file }, isSelected, options);
  }

  /**
   * Get potential warnings for state files
   *
   * @static
   * @param {ProcessedLogFile} file
   * @returns {(JSX.Element | null)}
   */
  public static getStateFileHint(file: UnzippedFile): JSX.Element | null {
    if (file.fileName.endsWith('root-state.json')) {
      const warnings = getRootStateWarnings(file);

      if (warnings && warnings.length > 0) {
        const content = warnings.join('\n');
        return (
          <Tooltip content={content} position={Position.RIGHT} boundary='viewport'>
            <Icon icon='error' intent={Intent.WARNING} />
          </Tooltip>
        );
      }
    }

    return null;
  }

  /**
   * Renders the little warning hint to the right of the file - if the
   * file contains any errors.
   *
   * @static
   * @param {ProcessedLogFile} file
   * @returns {(JSX.Element | null)}
   */
  public static getLogNodeHint(file: ProcessedLogFile): JSX.Element | null {
    const { levelCounts, repeatedCounts } = file;
    const hasErrors = levelsHave('error', levelCounts);
    const hasWarnings = levelsHave('warn', levelCounts);
    const excessiveRepeats = countExcessiveRepeats(repeatedCounts);

    if (!hasErrors && !hasWarnings && !excessiveRepeats) {
      return null;
    }

    // Check for errors
    let content = hasErrors
      ? `This file contains ${levelCounts.error} errors`
      : '';

    if (levelsHave('warn', levelCounts)) {
      content += hasErrors
        ? ` and ${levelCounts.warn} warnings.`
        : `This file contains ${levelCounts.warn} warnings.`;
    }

    // Check for excessive repeats
    if (excessiveRepeats) {
      // Not empty? Add a space
      if (content) content += ` `;

      const line = plural('lines', excessiveRepeats);
      const has = plural('has', excessiveRepeats, 'have');

      content += `${excessiveRepeats} log ${line} ${has} been excessively repeated.`;
    }

    return (
      <Tooltip content={content} position={Position.RIGHT} boundary='viewport'>
        <Icon icon='error' intent={Intent.WARNING} />
      </Tooltip>
    );
  }

  /**
   * Set the child nodes
   *
   * @static
   * @param {NODE_ID} searchId
   * @param {SidebarState} state
   * @param {Array<ITreeNode>} childNodes
   * @returns {void}
   */
  public static setChildNodes(
    searchId: NODE_ID,
    state: SidebarState,
    childNodes: Array<ITreeNode>
  ) {
    const parentNode = state.nodes.find(({ id }) => id === searchId);

    if (!parentNode) {
      return;
    }

    // Renderer and Preload is on their way out, so let's not show
    // these categories if we don't have files for them
    const hideIfEmpty = searchId === NODE_ID.PRELOAD || searchId === NODE_ID.RENDERER;
    if (childNodes.length === 0 && hideIfEmpty) {
      state.nodes = state.nodes.filter(({ id }) => searchId !== id);
    }

    parentNode.childNodes = childNodes;
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

  public render(): JSX.Element {
    const { isSidebarOpen } = this.props.state;
    const className = classNames('Sidebar', { Open: isSidebarOpen });

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

  /**
   * Do an operation for all nodes in the tree.
   *
   * @private
   * @param {Array<ITreeNode>} nodes
   * @param {(node: ITreeNode) => void} callback
   */
  private forEachNode(nodes: Array<ITreeNode>, callback: (node: ITreeNode) => void) {
    for (const node of nodes) {
      callback(node);

      if (node.childNodes) {
        this.forEachNode(node.childNodes, callback);
      }
    }
  }

  /**
   * Handle a click on a single tree node.
   *
   * @private
   * @param {ITreeNode} node
   * @param {Array<number>} _nodePath
   * @param {React.MouseEvent<HTMLElement>} _e
   */
  private handleNodeClick(node: ITreeNode, _nodePath: Array<number>, _e: React.MouseEvent<HTMLElement>) {
    const nodeData: any = node.nodeData;

    if (nodeData && nodeData.file) {
      this.props.state.selectLogFile(nodeData.file);
    }

    if (nodeData && nodeData.type) {
      this.props.state.selectLogFile(null, nodeData.type);
    }

    if (nodeData) {
      this.forEachNode(this.state.nodes, (n) => (n.isSelected = false));
      node.isSelected = true;

      this.setState(this.state);
    }
  }

  /**
   * Handle the collapsing of a node (aka a folder).
   *
   * @private
   * @param {ITreeNode} nodeData
   */
  private handleNodeCollapse(nodeData: ITreeNode) {
    nodeData.isExpanded = false;
    this.setState(this.state);
  }

  /**
   * Handle the expansion of a node (aka a folder).
   *
   * @private
   * @param {ITreeNode} nodeData
   */
  private handleNodeExpand(nodeData: ITreeNode) {
    nodeData.isExpanded = true;
    this.setState(this.state);
  }
}
