const vs_source = `
attribute vec2 a_vertexpos;
uniform vec2 u_resolution;

void main() {
    vec2 zeroToOne = a_vertexpos / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

const fs_source = `
precision mediump float;

void main() {
    gl_FragColor = vec4(1, 0, 0.5, 1);
}
`;

let shit = 0.01;

let canvas_w = 0;
let canvas_h = 0;

class Bird {
    static gravity = 0.6;
    static terminal_y = 10;

    constructor() {
        this.y_vel = 0;
        this.rect = { x: 50, y: 0, w: 50, h: 50 };
    }

    render(gl) {
        const vertices = [
            this.rect.x, this.rect.y,
            this.rect.x + this.rect.w, this.rect.y,
            this.rect.x, this.rect.y + this.rect.h,
            this.rect.x + this.rect.w, this.rect.y + this.rect.h,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }

    update(up) {
        this.rect.y += this.y_vel;
        this.y_vel += Bird.gravity;

        if (up) {
            console.log("up!");
            this.y_vel = -8;
        }

        if (this.y_vel > Bird.terminal_y)
            this.y_vel = Bird.terminal_y;
        // else if (this.y_vel < -Bird.terminal_y)
        //     this.y_vel = -Bird.terminal_y;

        if (this.rect.y >= canvas_h - this.rect.h)
            this.rect.y = canvas_h - this.rect.h;
        else if (this.rect.y <= 0)
            this.rect.y = 0;
    }
}

export default class Flappy {
    init(canvas, time_step) {
        console.log('trying init');
        if (this.initialized)
            return;

        console.log('DOING init');

        // GAME SETUP

        this.current_time = 0;
        this.accumulator = 0;
        this.canvas = canvas;
        canvas_w = this.canvas.width;
        canvas_h = this.canvas.height;
        this.time_step = time_step;

        this.walls = [];
        this.bird = new Bird();
        this.keys = [];
        window.addEventListener('keydown', this._on_key_down.bind(this));
        window.addEventListener('keyup', this._on_key_up.bind(this));

        // TODO: Link to ENeuralNetwork
        this.model = null;

        // GL SETUP

        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('Failed to get webgl context');
            return;
        }

        this.program = this._create_program();
        this.position_attrib = this.gl.getAttribLocation(this.program, 'a_vertexpos');
        this.resolution_uniform = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.position_buf = this.gl.createBuffer();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.position_buf);

        this.gl.useProgram(this.program);
        this.gl.enableVertexAttribArray(this.position_attrib);

        // Set position attributes
        const num_components = 2; // pull out 2 values per iteration
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0; // how many bytes to get from one set of values to the next
        const offset = 0; // how many bytes inside the buffer to start from
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.position_buf);

        this.gl.vertexAttribPointer(
            this.position_attrib,
            num_components,
            type,
            normalize,
            stride,
            offset
        );

        this.gl.uniform2f(this.resolution_uniform, this.gl.canvas.width, this.gl.canvas.height);

        // END GL SETUP
        this.initialized = true;

    }

    _on_key_up(e) {
        if (this.keys.includes(e.key))
            this.keys.splice(this.keys.indexOf(e.key), 1);
    }

    _on_key_down(e) {
        if (!this.keys.includes(e.key))
            this.keys.push(e.key);
    }

    delete() {
        this.gl.deleteProgram(this.program);
        window.cancelAnimationFrame(this.animation_frame);
    }

    _create_program() {
        console.log('create program');
        const vertex_shader = this._load_shader(this.gl.VERTEX_SHADER, vs_source);
        const frag_shader = this._load_shader(this.gl.FRAGMENT_SHADER, fs_source);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertex_shader);
        this.gl.attachShader(program, frag_shader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Failed to create program:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    _load_shader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Failed to compile shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return;
        }

        return shader;
    }

    set_time_step(time_step) {
        this.time_step = time_step;
    }

    // TODO: Link with ENeuralNetwork
    get_next_input() {
        // let ret = false;

        // if (this.keys.includes(' ')) {
        //     ret = true;
        //     this.keys.splice(this.keys.indexOf(' '), 1);
        // }

        // return ret;

        return Math.random() < 0.04;
    }

    render() {
        if (!this.canvas)
            return;

        this.gl.clearColor(this.r, this.g, this.b, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.bird.render(this.gl);
        const offset = 0;
        const vertex_count = 4;
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertex_count);
    }

    tick(dt) {
        if (!this.canvas)
            return;

        this.accumulator += (dt ?? 0) - this.current_time;
        this.current_time = dt ?? 0;

        while ((this.accumulator - this.time_step) >= 0) {
            this.r = Math.abs(Math.sin(shit));
            this.g = Math.abs(Math.sin(shit));
            this.b = Math.abs(Math.sin(shit));
            shit += 0.01;

            this.bird.update(this.get_next_input());

            this.accumulator -= this.time_step;
        }

        this.render();
        this.animation_frame = window.requestAnimationFrame(this.tick.bind(this));
    }
}
