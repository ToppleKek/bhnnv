import { Component } from "react";

export default class Slider extends Component {
    constructor(props) {
        super(props);
    }

    on_input = (e) => {
        this.props.onInput(e.target.value);
    };

    render() {
        return (
            <div className='slider-wrapper'>
                <input type='range' min={this.props.min} max={this.props.max} onInput={this.on_input} />
            </div>
        );
    }
}
