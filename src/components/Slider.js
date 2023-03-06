import { Component } from "react";
import './style/Slider.css';

export default class Slider extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: props.value
        };
    }

    on_input = (e) => {
        this.props.onInput(e.target.value);
    };

    on_mouse_down = (e) => {
        const r = e.target.getBoundingClientRect();
        const x = e.clientX - r.left;
        const value = (x / r.width) * this.props.max;
        console.log(x, (x / r.width), value);
        this.props.onInput(value);
        this.setState({ value });
    };

    render() {
        return (
            <div className='slider-wrapper' onMouseDown={this.on_mouse_down} on>
                <div className='slider-body'>

                </div>
                <span className='slider-text'>{this.state.value}</span>
                {/* <input className='slider-body' type='range' min={this.props.min} max={this.props.max} onInput={this.on_input} /> */}
            </div>
        );
    }
}
