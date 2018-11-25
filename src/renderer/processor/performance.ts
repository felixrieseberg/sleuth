import { ProcessorPerformanceInfo, LogType, ALL_LOG_TYPES } from '../interfaces';

let logBuffer: Array<ProcessorPerformanceInfo> = [];

export function logPerformance(input: ProcessorPerformanceInfo) {
  logBuffer.push({
    ...input,
    processingTime: Math.round(input.processingTime)
  });
}

export function combineResultsForType(type: LogType): ProcessorPerformanceInfo {
  return logBuffer.reduce((prev, curr) => {
    if (type !== LogType.ALL && curr.type !== type) return prev;

    return {
      ...prev,
      entries: prev.entries + curr.entries,
      lines: prev.lines + curr.lines,
      processingTime: prev.processingTime + curr.processingTime,
    };
  }, {
    entries: 0,
    lines: 0,
    processingTime: 0,
    name: `All ${type} logs`,
    type
  });
}

export function flushLogPerformance() {
  const summary: Array<ProcessorPerformanceInfo> = [];

  for (const logType of ALL_LOG_TYPES) {
    summary.push(combineResultsForType(logType));
  }

  console.table(logBuffer);
  console.table(summary);
  logBuffer = [];
}
