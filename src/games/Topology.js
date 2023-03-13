export default class Topology {
    // constructor()

    init(canvas, weights) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.weights = weights[1].dataSync();
        this.outputs = [];
        this.inputs = [];
    }

    render() {
        if (!this.canvas)
            return;

        const input_x = 100;
        const hidden_x = 300;
        const output_x = 500;
        const spacing = 40;
        const r = 15;
        const empty_input_nodes = (this.weights.length - this.inputs.length) / 2;
        const empty_output_nodes = (this.weights.length - this.outputs.length) / 2;
        const input_layer_start_y = Math.max(Math.floor(r * 2 * empty_input_nodes + (empty_input_nodes - 1) * (spacing - r * 2)), 0);
        const output_layer_start_y = Math.floor(r * 2 * empty_output_nodes + (empty_output_nodes - 1) * (spacing - r * 2));

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = 'white';
        this.ctx.fillStyle = 'green';
        for (let i = 0; i < this.inputs.length; ++i) {
            this.ctx.beginPath();
            this.ctx.arc(input_x, input_layer_start_y + (i + 1) * spacing, r, 0, 2 * Math.PI);

            if (this.inputs[i] >= 0.5)
                this.ctx.fill();

            for (let j = 0; j < this.weights.length; ++j) {
                this.ctx.moveTo(input_x, input_layer_start_y + (i + 1) * spacing);
                this.ctx.lineTo(hidden_x, (j + 1) * spacing);
            }

            this.ctx.stroke();
        }

        for (let i = 0; i < this.weights.length; ++i) {
            this.ctx.beginPath();
            this.ctx.arc(hidden_x, (i + 1) * spacing, r, 0, 2 * Math.PI);

            if (this.weights[i] >= 0.5)
                this.ctx.fill();

            for (let j = 0; j < this.outputs.length; ++j) {
                this.ctx.moveTo(hidden_x, (i + 1) * spacing);
                this.ctx.lineTo(output_x, output_layer_start_y + (j + 1) * spacing);
            }

            this.ctx.stroke();
        }

        for (let i = 0; i < this.outputs.length; ++i) {
            this.ctx.beginPath();
            this.ctx.arc(output_x, output_layer_start_y + (i + 1) * spacing, r, 0, 2 * Math.PI);

            if (this.outputs[i] >= 0.5)
                this.ctx.fill();

            this.ctx.stroke();
        }
    }
}
