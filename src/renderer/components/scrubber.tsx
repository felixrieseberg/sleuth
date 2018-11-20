import React from 'react';

export interface ScrubberProps {
  onResizeHandler: (newHeight: number) => void;
  elementSelector: string;
}

export interface ScrubberState {
  startY: number;
  startHeight: number;
}

export class Scrubber extends React.Component<ScrubberProps, ScrubberState> {
  private readonly refHandlers = {
    scrubber: (ref: HTMLDivElement) => this.element = ref,
  };
  private element: HTMLDivElement;

  constructor(props: ScrubberProps) {
    super(props);

    this.mouseDownHandler = this.mouseDownHandler.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.mouseUpHandler = this.mouseUpHandler.bind(this);
  }

  public mouseMoveHandler(e: any) {
    const { startHeight, startY } = this.state;
    const newHeight = startHeight + e.clientY - startY;
    this.props.onResizeHandler(newHeight);
  }

  public mouseDownHandler(e: any) {
    const resizeTarget = document.querySelector(this.props.elementSelector);

    if (!resizeTarget) return;

    this.setState({
      startY: e.clientY,
      startHeight: parseInt(document.defaultView.getComputedStyle(resizeTarget).height!, 10)
    });

    document.documentElement.addEventListener('mousemove', this.mouseMoveHandler, false);
    document.documentElement.addEventListener('mouseup', this.mouseUpHandler, false);
  }

  public mouseUpHandler() {
    document.documentElement.removeEventListener('mousemove', this.mouseMoveHandler, false);
    document.documentElement.removeEventListener('mouseup', this.mouseUpHandler, false);
  }

  public render() {
    return (
      <div ref={this.refHandlers.scrubber} className='Scrubber' onMouseDown={this.mouseDownHandler} />
    );
  }
}
