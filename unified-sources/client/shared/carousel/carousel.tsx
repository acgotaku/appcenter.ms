import * as React from "react";

const css = require("./carousel.scss");
const classNames = require("classnames");

interface CarouselProps {
  onScroll?: (selectedIndex: number) => void;
}

interface IndicatorDotProps {
  selected: boolean;
  scrollOffset: number;
  carousel: HTMLElement | null;
}

interface CarouselState {
  scrollLeft: number;
  clientWidth: number;
}

class IndicatorDot extends React.Component<IndicatorDotProps> {
  render() {
    return (
      <div className={classNames(css.indicatorDot, { [css.selected]: this.props.selected })} onClick={this.handleClick}>
        {this.props.children}
      </div>
    );
  }

  handleClick = () => {
    if (this.props.carousel) {
      this.props.carousel.scrollLeft = this.props.scrollOffset;
    }
  };
}

export class Carousel extends React.Component<CarouselProps, CarouselState> {
  constructor(props: CarouselProps) {
    super(props);
    this.state = {
      scrollLeft: 0,
      clientWidth: 0,
    };
  }

  private carousel: HTMLElement | null = null;
  private numDots: number = React.Children.count(this.props.children);
  private selectedIndex = 0;

  private get indicatorDots() {
    const indicatorDots: JSX.Element[] = [];
    for (let dot = 0; dot < this.numDots; dot++) {
      const selected = this.selected(dot);
      this.selectedIndex = selected ? dot : this.selectedIndex;
      indicatorDots.push(
        <IndicatorDot key={dot} selected={selected} scrollOffset={dot * this.state.clientWidth} carousel={this.carousel} />
      );
    }
    return indicatorDots;
  }

  private selected(dot: number): boolean {
    if (this.state.clientWidth === 0) {
      return dot === 0;
    }
    const bottom = Math.floor(this.state.scrollLeft / this.state.clientWidth);
    const innerPosition = this.state.scrollLeft % this.state.clientWidth;
    const selectedDot = innerPosition < this.state.clientWidth / 2 ? bottom : bottom + 1;
    return dot === selectedDot;
  }

  render() {
    return (
      <div>
        <div
          className={css.carousel}
          ref={(x) => {
            this.carousel = x;
          }}
        >
          {this.props.children}
        </div>
        <div className={css.indicatorDots}>{this.indicatorDots}</div>
      </div>
    );
  }

  componentDidMount() {
    this.updateClientWidth();
    if (this.carousel) {
      this.carousel.addEventListener("scroll", this.updateClientWidth);
    }
  }

  private updateClientWidth = () => {
    if (this.carousel) {
      this.setState({
        scrollLeft: this.carousel.scrollLeft,
        clientWidth: this.carousel.clientWidth,
      });
    }
  };
}
