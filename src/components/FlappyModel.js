import * as tf from '@tensorflow/tfjs';
import { Component, createRef } from 'react';
import { Button } from '.';
import Flappy from '../games/Flappy';
import Expandable from './Expandable';
import './style/TestModel.css';
import TaggedLabel from './TaggedLabel';

const model = tf.sequential();

export default class FlappyModel extends Component {
    constructor(props) {
        super(props);

        this.canvas_ref = createRef(null);
        this.game = new Flappy();

        this.state = {
            started: false,
            game_timestep: 100,
            training: false
        };
    }

    componentDidMount() {
        this.game.init(this.canvas_ref.current, 17);
        this.game.tick();
    }

    componentWillUnmount() {
        this.game.delete();
    }

    render() {
        return (
            <div className='model-wrapper'>
                <div className='model-controls'>
                    Game timestep
                </div>
                <div className='model-app'>
                    <canvas width={800} height={600} ref={this.canvas_ref} />
                </div>
                <div className='model-status'>
                    <Expandable title='Memory'>
                        <TaggedLabel tag='Usage'>
                            {tf.memory().numBytes / 1024}KiB
                        </TaggedLabel>
                        <TaggedLabel tag='Tensors'>
                            {tf.memory().numTensors}
                        </TaggedLabel>
                        <TaggedLabel tag='Data Buffers'>
                            {tf.memory().numDataBuffers}
                        </TaggedLabel>
                    </Expandable>
                </div>
            </div>
        );
    }
}
