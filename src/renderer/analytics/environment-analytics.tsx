import React from 'react';
import { getOSInfo, getVersionInfo } from '../../utils/settings-data-helper';
import { getChannelInfo } from './settings-analytics';

export function getEnvInfo(data: any): Array<JSX.Element> {
  const result: Array<JSX.Element> = [];
  result.push(<p>📋 This user is running Slack <span>{getVersionInfo(data)}</span> on {getOSInfo(data)}</p>);
  result.push(<p>📡 {getChannelInfo(data)}</p>);
  result.push(<p>🖥 GPU Composition is {getGPUComposition(data)}.</p>);
  return result;
}

function getGPUComposition({ isGpuCompositionAvailable }: any): string {
  return isGpuCompositionAvailable === true ? 'available' : 'unavailable';
}
