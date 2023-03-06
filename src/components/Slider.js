import { Component } from "react";
import './style/Slider.css';

export default class Slider extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: props.value,
            down: false
        };
    }

    update_slider_value(client_x, rect) {
        const x = client_x - rect.left;
        const value = (x / rect.width) * (this.props.max - this.props.min) + this.props.min;
        this.props.onInput(value);
        this.setState({ value });
    }

    on_mouse_down = (e) => {
        this.update_slider_value(e.clientX, e.target.getBoundingClientRect());
        this.setState({ down: true });
    };

    on_mouse_up = (e) => {
        this.setState({ down: false });
    };

    on_move = (e) => {
        if (this.state.down)
            this.update_slider_value(e.clientX, e.target.getBoundingClientRect());
    };

    render() {
        return (
            <div className='slider-wrapper' onMouseMove={this.on_move} onMouseUp={this.on_mouse_up} onMouseDown={this.on_mouse_down} onMouseLeave={this.on_mouse_up} style={{background: `linear-gradient(to right, var(--colour-interactable) ${this.state.value / (this.props.max - this.props.min) * 100}%, var(--colour-grid_border) 1px)`}}>
                <div className='slider-body'></div>
                <span className='slider-text'>{this.state.value}</span>
            </div>
        );
    }
}
