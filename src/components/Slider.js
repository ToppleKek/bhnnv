import { Component, createRef } from "react";
import './style/Slider.css';

export default class Slider extends Component {
    constructor(props) {
        super(props);

        this.slider_ref = createRef(null);
        document.addEventListener('mousemove', this.on_move);
        document.addEventListener('mouseup', this.on_mouse_up);
        this.state = {
            value: props.value,
            down: false
        };
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.on_move);
        document.removeEventListener('mouseup', this.on_mouse_up);
    }

    update_slider_value(client_x, rect) {
        const x = client_x - rect.left;
        let value = Math.trunc(((x / rect.width) * (this.props.max - this.props.min) + this.props.min) * 100) / 100;

        if (value > this.props.max)
            value = this.props.max;
        else if (value < this.props.min)
            value = this.props.min;

        this.props.onInput(value);
        this.setState({ value });
    }

    on_mouse_down = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const r = e.target.getBoundingClientRect();
        this.update_slider_value(e.clientX, r);
        this.setState({ down: true });
    };

    on_mouse_up = (e) => {
        this.setState({ down: false });
    };

    on_move = (e) => {
        if (this.state.down) {
            const r = this.slider_ref.current.getBoundingClientRect();
            this.update_slider_value(e.pageX, r);
        }
    };

    render() {
        return (
            <div className='slider-wrapper' ref={this.slider_ref} onMouseDown={this.on_mouse_down} style={{ background: `linear-gradient(to right, var(--colour-interactable) ${this.state.value / (this.props.max - this.props.min) * 100}%, var(--colour-grid_border) 1px)` }}>
                <div className='slider-body' />
                <span className='slider-text'>{this.props.label} - {this.state.value}</span>
            </div>
        );
    }
}
