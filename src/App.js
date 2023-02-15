import './App.css';
import * as Constants from './constants';
import * as Status from './status/status';
import * as RichPopup from './status/RichPopup';
import * as tf from '@tensorflow/tfjs';
import { Component, createRef } from 'react';
import {
    Selector,
    InlineButton,
    Button,
    TestModel,
    FlappyModel
} from './components';

class App extends Component {
    constructor(props) {
        console.log(tf.ENV.getFlags());
        super(props);

        window.tf = tf;

        this.theme = 'dark';
        this._update_theme();
        Status.register_popup_callback(this.on_popup_request);
        Status.register_rich_popup_callback(this.on_rich_popup_request);

        const gpu_test_canvas = document.createElement('canvas');
        const gl = gpu_test_canvas.getContext('webgl');
        const debug = gl.getExtension('WEBGL_debug_renderer_info');

        this.state = {
            theme: 'dark',
            mobile: false,
            gpu: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
            gpu_vendor: gl.getParameter(debug.UNMASKED_VENDOR_WEBGL),
            model: 'test',
            popup: {
                rich: false,
                rich_body: [],
                header: null,
                message: null,
                buttons: [],
                callback: null
            }
        };
    }

    _update_theme() {
        for (const prop in Constants.THEMES[this.theme])
            document.documentElement.style.setProperty(`--colour-${prop}`, Constants.THEMES[this.theme][prop]);
    }

    componentDidMount() {
        console.log('App did mount!');

        const is_mobile = window.matchMedia('(max-width: 1000px)');
        is_mobile.addEventListener('change', (event) =>
            this.setState({
                mobile: event.matches
            })
        );
    }

    componentDidUpdate(previous_props) {
        console.log('App did update!');
    }

    on_popup_request = (buttons, header, message) => {
        return this.on_generic_popup_request(false, buttons, {header, message});
    };

    on_rich_popup_request = (buttons, header, body) => {
        return this.on_generic_popup_request(true, buttons, {header, body});
    };

    on_generic_popup_request = (rich, buttons, opts) => {
        const dialog_promise = new Promise((resolve) => {
            this.setState((state, props) => {
                if (state.popup.callback !== null)
                    resolve(null);

                return {
                    popup: {
                        rich,
                        rich_body: rich ? opts.body : [],
                        header: opts.header,
                        message: !rich ? opts.message : null,
                        buttons,
                        callback: resolve
                    }
                };
            });
        });

        return new Promise(async (resolve) => {
            const dialog_result = await dialog_promise;

            this.setState({
                popup: {
                    rich: false,
                    rich_body: [],
                    header: null,
                    message: null,
                    buttons: [],
                    callback: null
                }
            });

            resolve(dialog_result);
        });
    };


    on_theme_toggle = () => {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this._update_theme();
    };

    test_rich = () => {
        const body = (
            <>
                <RichPopup.Checkbox key_name={'test'} name={'test'} label={'test checkbox'} value={true} />
            </>
        );
        Status.rich_popup(
            [Constants.POPUP_BUTTON_YES, Constants.POPUP_BUTTON_NO],
            'Test RichPopup dialog',
            body,
        ).then((result) => {
            console.log(result.button);
            console.dir(result.data);
        });
    };

    on_select_test_model = () => {
        this.setState({
            model: 'test'
        });
    };

    on_select_flappy_model = () => {
        this.setState({
            model: 'flappy'
        });
    };

    render() {
        // if (!this.state.course_data) {
        //     console.log('Course data is still null');
        //     return (
        //         <div className='App'>
        //             Loading course data.
        //         </div>
        //     );
        // }

        let popup = null;

        if (this.state.popup.callback !== null && this.state.popup.rich) {
            popup = (
                <RichPopup.Popup
                    header={this.state.popup.header}
                    buttons={this.state.popup.buttons}
                    onInteract={this.state.popup.callback}
                >
                    {this.state.popup.rich_body}
                </RichPopup.Popup>
            );
        } else if (this.state.popup.callback !== null) {
            popup = (
                <Status.Popup
                    header={this.state.popup.header}
                    message={this.state.popup.message}
                    buttons={this.state.popup.buttons}
                    onInteract={this.state.popup.callback}
                />
            );
        }

        let model;

        if (this.state.model === 'test')
            model = <TestModel />;
        else if (this.state.model === 'flappy')
            model = <FlappyModel />;

        return (
            <div className="App">
                {popup}

                <div className='banner header'>
                    <div className='banner-left'>
                        <div className='banner-text title-text'>bhnnv</div>
                    </div>
                    <div className='banner-center'>
                        <InlineButton value='Test Model' onClick={this.on_select_test_model} />
                        <InlineButton value='Flappy Bird' onClick={this.on_select_flappy_model} />
                    </div>
                    <div className='banner-right'>
                        <InlineButton value='Rich Popup' onClick={this.test_rich} />
                        <InlineButton value='Change theme' onClick={this.on_theme_toggle} />
                    </div>
                </div>
                <div className='main-content'>
                    {model}
                </div>
                <div className='banner'>
                    <div className='banner-left'>
                        <div className='banner-text'>
                            {`Running TensorFlow.js ${tf.version.tfjs} with backend: ${tf.getBackend() ?? 'not initialized'} GPU: ${this.state.gpu}`}
                        </div>
                    </div>
                    <div className='banner-center'>
                        <div className='banner-text'></div>
                    </div>
                    <div className='banner-right'>
                        <div className='banner-text'>2023 Braeden Hong</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
