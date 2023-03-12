import { Component } from 'react';
import './style/Button.css';

export default class Button extends Component {
    clicked = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.onClick(this.props.value);
    };

    render() {
        const class_list = `generic-button ${this.props.role}-button ${this.props.className || ''}`;

        return (
            <div className={class_list} onClick={this.clicked}>
                <span>{this.props.value}</span>
            </div>
        );
    }
}
