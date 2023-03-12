import * as tf from '@tensorflow/tfjs';
import { Component, createRef } from 'react';
import { Button, Checkbox, Slider } from '.';
import Flappy from '../games/Flappy';
import Topology from '../games/Topology';
import Expandable from './Expandable';
import './style/FlappyModel.css';
import TaggedLabel from './TaggedLabel';

tf.setBackend('cpu');

const model = tf.sequential({
    layers: [
        tf.layers.dense({ units: 12, inputShape: [5], activation: 'sigmoid' }),
        tf.layers.dense({ units: 2, activation: 'softmax' })
    ],
});

const NUM_AGENTS = 400;

export default class FlappyModel extends Component {
    constructor(props) {
        super(props);

        this.canvas_ref = createRef(null);
        this.topology_canvas_ref = createRef(null);
        this.game = new Flappy(this.on_data, this.get_input, this.on_game_end, this.on_topology_data);
        this.topology_renderer = new Topology();
        this.current_weights = [];

        for (let i = 0; i < NUM_AGENTS; ++i)
            this.current_weights.push({ weights: model.getWeights().map((w) => tf.randomStandardNormal(w.shape)), fitness: 0 });

        model.setWeights(this.current_weights[0].weights);

        this.state = {
            started: false,
            game_timestep: 16,
            game_data: null,
            total_agent_count: NUM_AGENTS,
            current_agent: 0,
            current_generation: 0,
            fast_forward: false,
            show_topology: false,
            top_weights: []
        };
    }

    componentDidMount() {
        this.game.init(this.canvas_ref.current, this.state.game_timestep);
        this.topology_renderer.init(this.topology_canvas_ref.current, this.current_weights[this.state.current_agent].weights);
        this.game.do_frame();
    }

    componentWillUnmount() {
        this.game.delete();
    }

    on_data = (game_data) => {
        this.setState({ game_data });
    };

    on_topology_data = (data) => {
        this.topology_renderer.inputs = data.inputs;
        this.topology_renderer.outputs = data.outputs;

        if (!this.state.fast_forward && this.state.show_topology)
            this.topology_renderer.render();
    };

    _gaussian_random() {
        let n = 0;

        for (let i = 0; i < 6; ++i)
            n += Math.random();

        return n / 6;
    }

    on_game_end = (fitness) => {
        this.current_weights[this.state.current_agent].fitness = fitness;

        if (this.state.current_agent === this.state.total_agent_count - 1) {
            const sum = this.current_weights.reduce((prev, curr) => ({ fitness: prev.fitness + curr.fitness })).fitness;
            const normalized_fitnesses = this.current_weights.map((w) => ({ weights: w.weights, fitness: w.fitness / sum }));
            console.log({ normalized_fitnesses });
            let new_weights = [];

            const copy_and_mutate = (weights) => {
                const weight_copy = weights.map((w) => w.clone());

                for (let i = 0; i < weights.length; ++i) {
                    const tensor_values = weight_copy[i].dataSync().slice();
                    tf.tidy(() => {
                        for (let k = 0; k < tensor_values.length; ++k) {
                            if (Math.random() < 0.1) {
                                const mutation = this._gaussian_random();
                                tensor_values[k] += mutation;
                            }
                        }
                    });

                    const mutated = tf.tensor(tensor_values, weight_copy[i].shape);
                    weight_copy[i].dispose();
                    weight_copy[i] = mutated;
                }

                return weight_copy;
            };

            for (let i = 0; i < normalized_fitnesses.length; ++i) {
                let index = 0;
                let r = Math.random();
                while (r > 0) {
                    r -= normalized_fitnesses[index].fitness;
                    ++index;
                }
                --index;
                console.log('selecting weights with fitness:', this.current_weights[index].fitness);
                new_weights.push({ weights: copy_and_mutate(normalized_fitnesses[index].weights), fitness: 0 });
            }

            this.current_weights.forEach((wf) => wf.weights.forEach((w) => w.dispose()));

            // Get top weights to update top all time weights
            this.current_weights.sort((a, b) => b.fitness - a.fitness);
            const top_weights = this.current_weights.splice(0, 5).map((w) => Object.assign(w, { generation: this.state.current_generation }));

            console.log({ new_weights });
            this.current_weights = new_weights;
            this.setState((old_state) => {
                const new_top_weights = old_state.top_weights.concat(top_weights);
                new_top_weights.sort((a, b) => b.fitness - a.fitness);
                return {
                    current_agent: 0,
                    current_generation: old_state.current_generation + 1,
                    top_weights: new_top_weights.splice(0, 5)
                };
            });
        } else {
            model.setWeights(this.current_weights[this.state.current_agent + 1].weights);
            this.topology_renderer.weights = this.current_weights[this.state.current_agent + 1].weights[1].dataSync();
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

    on_fast_forward_change = (checked) => {
        this.game.fast_forward = checked;
        this.setState({ fast_forward: checked });
    };

    on_topology_visibility_change = (checked) => {
        this.setState({ show_topology: checked });
    };

    save_weights = () => {
        const data = {
            generation: this.state.current_generation,
            weights: this.current_weights.map((cw) =>
                cw.weights.map(
                    (w) => ({ shape: w.shape, data: w.arraySync() })
                )
            )
        };

        const url = URL.createObjectURL(new Blob([JSON.stringify(data)]), { type: 'application/json' });
        const a = document.createElement('a');
        a.href = url;
        a.download = `bhnnv_weights_gen${this.state.current_generation}.json`;
        a.click();
        a.remove();
    };

    load_weights = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.oninput = () => {
            const reader = new FileReader();
            reader.readAsText(input.files[0], 'UTF-8');

            reader.onload = () => {
                const data = JSON.parse(reader.result);
                // TODO: when we change the number of agents, this might change a bit as well
                const new_current_weights = data.weights.map((cw) => ({ fitness: 0, weights: cw.map((w) => new tf.tensor(w.data, w.shape))}));

                for (const phenotype of this.current_weights) {
                    for (const t of phenotype.weights)
                        t.dispose();
                }

                this.setState({ current_generation: data.generation, current_agent: 0 }); // TODO: Save/load top weights?
                this.current_weights = new_current_weights;
                this.game.game_reset();
            };
        };

        input.click();
        input.remove();
    };

    render() {
        const wall_data = this.state.game_data === null ? null : this.state.game_data.walls.map((wall) => <span>x={wall.rect.x} y={wall.rect.y}</span>);
        const sorted_weights = this.current_weights.slice();
        sorted_weights.sort((a, b) => b.fitness - a.fitness);

        return (
            <div className='model-wrapper'>
                <div className='model-controls'>
                    <Slider min={0.1} max={100.0} value={this.state.game_timestep} label='Timestep' onInput={this.on_timestep_change} />
                    <Checkbox onChange={this.on_fast_forward_change} checked={false} label='Fast forward' />
                    <Checkbox onChange={this.on_topology_visibility_change} checked={false} label='Show Topology Graph' />
                    <Button role='normal' value='Save weights' onClick={this.save_weights} />
                    <Button role='normal' value='Load weights' onClick={this.load_weights} />
                </div>
                <div className='model-app'>
                    {this.state.fast_forward &&
                        <div className='fast-forward-banner'>
                            <h1>Fast-forward in progress</h1>
                            <span>Draw calls are disabled and the simulation is running as fast as possible on your machine. (Each animation frame will now attempt to simulate a given mutation for 50,000 ticks.)</span>
                        </div>
                    }
                    <canvas className={`game-canvas ${this.state.fast_forward ? 'dimmed' : ''}`} width={800} height={600} ref={this.canvas_ref} />
                    <canvas className={`topology-overlay ${this.state.fast_forward ? 'dimmed' : ''}`} style={{ display: this.state.show_topology ? '' : 'none' }} width={800} height={600} ref={this.topology_canvas_ref} />
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
                        <TaggedLabel tag='Inputs'>
                            <div className='label-list'>
                                {this.game.last_input.map((e) => <span>{e}</span>)}
                            </div>
                        </TaggedLabel>
                        <TaggedLabel tag='Outputs'>
                            <div className='label-list'>
                                {this.game?.last_output.toString().replace(',', '\n')}
                            </div>
                        </TaggedLabel>
                    </Expandable>
                    <Expandable title='Progress'>
                        <TaggedLabel tag='Top Genomes'>
                            (this generation)
                            <div className='label-list'>
                                {sorted_weights.splice(0, 5).map((w) => <span>{w.fitness.toString()}</span>)}
                            </div>
                        </TaggedLabel>
                        <TaggedLabel tag='Top Genomes'>
                            (whole simulation)
                            <div className='label-list'>
                                {this.state.top_weights.map((w) => <span>{w.fitness.toString()} - Generation {w.generation}</span>)}
                            </div>
                        </TaggedLabel>
                    </Expandable>
                </div>
            </div>
        );
    }
}
