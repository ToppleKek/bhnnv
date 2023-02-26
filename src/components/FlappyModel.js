import * as tf from '@tensorflow/tfjs';
import { Component, createRef } from 'react';
import { Button, Slider } from '.';
import Flappy from '../games/Flappy';
import Expandable from './Expandable';
import './style/FlappyModel.css';
import TaggedLabel from './TaggedLabel';

const model = tf.sequential({
    layers: [
        tf.layers.dense({ units: 16, inputShape: [5], activation: 'sigmoid', name: 'hidden' }),
        tf.layers.dense({ units: 2, activation: 'softmax' })
    ],
    useBias: false
});

tf.setBackend('cpu');

const NUM_AGENTS = 200;

export default class FlappyModel extends Component {
    constructor(props) {
        super(props);

        this.canvas_ref = createRef(null);
        this.game = new Flappy(this.on_data, this.get_input, this.on_game_end);
        this.current_weights = [];

        for (let i = 0; i < NUM_AGENTS; ++i)
            this.current_weights.push({ weights: model.getWeights().map((w) => tf.randomStandardNormal(w.shape)), fitness: 0 });

        model.setWeights(this.current_weights[0].weights);

        this.state = {
            started: false,
            game_timestep: 16,
            training: false,
            game_data: null,
            total_agent_count: NUM_AGENTS,
            current_agent: 0,
            current_generation: 0
        };
    }

    componentDidMount() {
        // model.setWeights(this.current_weights[0].weights);
        this.game.init(this.canvas_ref.current, this.state.game_timestep);
        this.game.tick();
    }

    componentWillUnmount() {
        this.game.delete();
    }

    on_data = (game_data) => {
        this.setState({ game_data });
    };

    gaussianRandom(mean=0, stdev=1) {
        let u = 1 - Math.random(); //Converting [0,1) to (0,1)
        let v = Math.random();
        let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        // Transform to the desired mean and standard deviation:
        return z * stdev + mean;
    }

    on_game_end = (fitness) => {
        this.current_weights[this.state.current_agent].fitness = fitness;

        if (this.state.current_agent === this.state.total_agent_count - 1) {
            console.log('next generation');

            const sum = this.current_weights.reduce((prev, curr) => ({ fitness: prev.fitness + curr.fitness })).fitness;
            const normalized_fitnesses = this.current_weights.map((w) => ({ weights: w.weights, fitness: (w.fitness < 0 ? 1 : w.fitness) / sum }));

            console.log({normalized_fitnesses});
            let new_weights = [];
            const n = Math.random();
            let accumulator = 0;

            const copy_and_mutate = (weights) => {
                const weight_copy = weights.map((w) => w.clone());

                for (let i = 0; i < weight_copy.length; ++i) {
                    const tensor_values = weight_copy[i].dataSync();
                    for (let k = 0; k < tensor_values.length; ++k) {
                        if (Math.random() < 0.1) {
                            const mutation = this.gaussianRandom();
                            tensor_values[k] += mutation;
                        }
                    }

                    weight_copy[i].dispose();
                    weight_copy[i] = tf.tensor(tensor_values, weight_copy[i].shape);
                }

                return weight_copy;
            };

            // outer:
            // for (let j = 0; j < normalized_fitnesses.length; ++j) {
            //     for (let i = 0; i < normalized_fitnesses.length - 1; ++i) {
            //         accumulator += normalized_fitnesses[i].fitness;
            //         if (accumulator < n) {
            //             console.log('selecting weights with fitness:', this.current_weights[i].fitness);
            //             debugger;
            //             new_weights.push({ weights: copy_and_mutate(normalized_fitnesses[i].weights), fitness: 0 });
            //             continue outer;
            //         }
            //     }

            //     console.log('selecting weights with fitness:', this.current_weights[normalized_fitnesses.length - 1].fitness);
            //     new_weights.push({ weights: copy_and_mutate(normalized_fitnesses[normalized_fitnesses.length - 1].weights), fitness: 0 });
            // }

            for (let i = 0; i < normalized_fitnesses.length; ++i) {
                let index = 0;
                let r = Math.random();
                while (r > 0) {
                    r -= normalized_fitnesses[index].fitness;
                    ++index;
                }
                --index;
                console.log('selecting weights with fitness:', this.current_weights[i].fitness);
                new_weights.push({ weights: copy_and_mutate(normalized_fitnesses[i].weights), fitness: 0 });
            }

            this.current_weights.forEach((wf) => wf.weights.forEach((w) => w.dispose()));
            console.log({new_weights});
            this.current_weights = new_weights;
            this.setState((old_state) => ({ current_agent: 0, current_generation: old_state.current_generation + 1 }));
        } else {
            model.setWeights(this.current_weights[this.state.current_agent + 1].weights);
            this.setState((old_state) => ({ current_agent: old_state.current_agent + 1 }));
        }
    };

    get_input = (data) => {
        let ret;

        tf.tidy(() => {
            ret = model.predict(tf.tensor2d([data])).dataSync();
        });

        return ret;
    };

    on_timestep_change = (value) => {
        this.game.set_time_step(Number.parseFloat(value));
    };

    render() {
        const wall_data = this.state.game_data === null ? null : this.state.game_data.walls.map((wall) => <span>x={wall.rect.x} y={wall.rect.y}</span>);
        return (
            <div className='model-wrapper'>
                <div className='model-controls'>
                    Game timestep
                    <Slider min={0.1} max={100.0} onInput={this.on_timestep_change} />
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
                            <span>x={this.state.game_data?.agent?.rect?.x ?? 'NULL'} y={this.state.game_data?.agent?.rect?.y ?? 'NULL'}</span>
                        </TaggedLabel>
                    </Expandable>
                    <Expandable title='Model Information'>
                        <TaggedLabel tag='Fitness'>
                            <span>{this.state.game_data?.agent?.fitness}</span>
                        </TaggedLabel>
                        <TaggedLabel tag='Generation'>
                            <span>{this.state.current_generation}</span>
                        </TaggedLabel>
                    </Expandable>
                </div>
            </div>
        );
    }
}
