import * as tf from '@tensorflow/tfjs';
import { Component, createRef } from 'react';
import { Button } from '.';
import Flappy from '../games/Flappy';
import Expandable from './Expandable';
import './style/FlappyModel.css';
import TaggedLabel from './TaggedLabel';

const model = tf.sequential();

export default class FlappyModel extends Component {
    constructor(props) {
        super(props);

        this.canvas_ref = createRef(null);
        this.game = new Flappy(this.on_data);

        this.state = {
            started: false,
            game_timestep: 100,
            training: false,
            game_data: null
        };
    }

    componentDidMount() {
        this.game.init(this.canvas_ref.current, 17);
        this.game.tick();
    }

    componentWillUnmount() {
        this.game.delete();
    }

    on_data = (game_data) => {
        this.setState({ game_data });
    };

    render() {
        const wall_data = this.state.game_data === null ? null : this.state.game_data.walls.map((wall) => <span>x={wall.rect.x} y={wall.rect.y}</span>);
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
                    <Expandable title='Game Data'>
                        <TaggedLabel tag='Walls'>
                            <span>{wall_data === null ? 'NULL' : wall_data.length}</span>
                            <div className='label-list'>
                                {wall_data ?? 'NULL'}
                            </div>
                        </TaggedLabel>
                        <TaggedLabel tag='Agent'>
                            <span>x={this.state.game_data?.agent?.rect?.x || 'NULL'} y={this.state.game_data?.agent?.rect?.y || 'NULL'}</span>
                        </TaggedLabel>
                    </Expandable>
                </div>
            </div>
        );
    }
}
