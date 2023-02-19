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
    static gravity = 0.55;
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
        const offset = 0;
        const vertex_count = 4;

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertex_count);
    }

    update(up) {
        this.rect.y += this.y_vel;
        this.y_vel += Bird.gravity;

        if (up)
            this.y_vel = -6.5;


        if (this.y_vel > Bird.terminal_y)
            this.y_vel = Bird.terminal_y;

        if (this.rect.y >= canvas_h - this.rect.h)
            this.rect.y = canvas_h - this.rect.h;
        else if (this.rect.y <= 0)
            this.rect.y = 0;
    }
}

class Wall {
    constructor() {
        this.rect = { x: canvas_w, y: 0, w: 100, h: Math.floor(Math.random() * (canvas_h - 150)) };
        this.bottom_rect = { x: this.rect.x, y: this.rect.h + 150, w: 100, h: canvas_h - (this.rect.h + 150) };
    }

    render(gl) {
        {
            const vertices = [
                this.rect.x, this.rect.y,
                this.rect.x + this.rect.w, this.rect.y,
                this.rect.x, this.rect.y + this.rect.h,
                this.rect.x + this.rect.w, this.rect.y + this.rect.h,
            ];
            const offset = 0;
            const vertex_count = 4;

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertex_count);
        }
        {
            const vertices = [
                this.bottom_rect.x, this.bottom_rect.y,
                this.bottom_rect.x + this.bottom_rect.w, this.bottom_rect.y,
                this.bottom_rect.x, this.bottom_rect.y + this.bottom_rect.h,
                this.bottom_rect.x + this.bottom_rect.w, this.bottom_rect.y + this.bottom_rect.h,
            ];
            const offset = 0;
            const vertex_count = 4;

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertex_count);
        }

    }

    update() {
        this.rect.x -= 2;
        this.bottom_rect.x = this.rect.x;
    }
}

export default class Flappy {
    constructor(data_callback, get_input_callback) {
        this.data_callback = data_callback;
        this.get_input_callback = get_input_callback;
    }

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
        this.running = true;
        this.ticks = 1;

        this.walls = [new Wall()];
        this.bird = new Bird();
        this.keys = [];

        window.addEventListener('keydown', this._on_key_down.bind(this));
        window.addEventListener('keyup', this._on_key_up.bind(this));

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

    game_reset() {
        // this.walls = [];
        // this.bird = new Bird();

        // window.cancelAnimationFrame(this.animation_frame);
        this.running = false;
        console.log('reset');
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
        const res = this.get_input_callback([
            this.bird.rect.y / canvas_h,
            (this.walls[0].rect.y + this.walls[0].rect.h) / canvas_h,
            this.walls[0].bottom_rect.y / canvas_h,
            this.walls[0].rect.x / canvas_w
        ]);

        console.log(res);

        return res[0] > res[1];
        // let ret = false;

        // if (this.keys.includes(' ')) {
        //     ret = true;
        //     this.keys.splice(this.keys.indexOf(' '), 1);
        // }

        // return ret;

        // return Math.random() < 0.04;
    }

    render() {
        if (!this.canvas)
            return;

        this.gl.clearColor(this.r, this.g, this.b, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.bird.render(this.gl);
        this.walls.forEach((wall) => wall.render(this.gl));
    }

    tick(dt) {
        if (!this.canvas)
            return;

        if (this.current_time === 0 && dt !== undefined)
            this.current_time = dt;

        this.accumulator += (dt ?? 0) - this.current_time;
        this.current_time = dt ?? 0;

        while ((this.accumulator - this.time_step) >= 0) {
            this.r = Math.abs(Math.sin(shit));
            this.g = Math.abs(Math.sin(shit));
            this.b = Math.abs(Math.sin(shit));
            shit += 0.01;

            this.bird.update(this.get_next_input());
            this.walls.forEach((wall) => wall.update());
            this.walls = this.walls.filter((wall) => wall.rect.x + wall.rect.w >= 0);

            if (Math.floor(this.ticks % 175) === 0)
                this.walls.push(new Wall());

            if (this._intersects(this.walls[0].rect, this.bird.rect) || this._intersects(this.walls[0].bottom_rect, this.bird.rect)) {
                console.log('collide');
                this.game_reset();
            }

            this.data_callback({ walls: this.walls, agent: this.bird });
            this.accumulator -= this.time_step;
            ++this.ticks;
        }

        this.render();

        if (this.running)
            this.animation_frame = window.requestAnimationFrame(this.tick.bind(this));
    }

    _intersects(rect1, rect2) {
        const a = rect1.x < rect2.x + rect2.w;
        const b = rect1.x + rect1.w > rect2.x;
        const c = rect1.y < rect2.y + rect2.h;
        const d = rect1.y + rect1.h > rect2.y;
        const collide = a && b && c && d;
        return collide;
    }
}
