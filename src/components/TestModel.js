import * as tf from '@tensorflow/tfjs';
import { Component } from 'react';
import { Button } from '.';
import Expandable from './Expandable';
import './style/TestModel.css';
import TaggedLabel from './TaggedLabel';

const model = tf.sequential();
model.add(tf.layers.dense({units: 1, inputShape: [1]}));
model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

export default class TestModel extends Component {
    constructor(props) {
        super(props);

        this.state = {
            started: false,
            training: false
        };

    }

    start_training = () => {
        const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
        const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

        this.setState({
            started: true,
            training: true
        });

        model.fit(xs, ys, {epochs: 1000}).then(() => {
            this.setState({ training: false });
            xs.dispose();
            ys.dispose();
        });
    };

    render() {
        let status = 'Click start training';

        if (this.state.started && this.state.training)
            status = 'Now training...';
        else if (this.state.started && !this.state.training) {
            const sample = tf.tensor2d([5], [1, 1]);
            const result = model.predict(sample);
            status = result.toString();
            sample.dispose();
            result.dispose();
        }

        return (
            <div className='model-wrapper'>
                <div className='model-controls'>
                    <Button role='positive' value='Start training' onClick={this.start_training}/>
                </div>
                <div className='model-app'>
                    <span>{status}</span>
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
