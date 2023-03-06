import { Component, createRef } from 'react';
import './style/TopologyOverlay.css';

export default class TopologyOverlay extends Component {
    constructor(props) {
        super(props);

        this.canvas_ref = createRef(null);
    }
    render() {
        return (
            <div className='topology-overlay'>
                <canvas ref={this.canvas_ref} height={300} width={600} />
            </div>
        );
    }
}
