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
        const spacing = 45;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = 'white';
        this.ctx.fillStyle = 'green';
        for (let i = 0; i < this.inputs.length; ++i) {
            this.ctx.beginPath();
            this.ctx.arc(input_x, (i + 1) * spacing, 20, 0, 2 * Math.PI);

            if (this.inputs[i] >= 0.5)
                this.ctx.fill();

            for (let j = 0; j < this.weights.length; ++j) {
                this.ctx.moveTo(input_x, (i + 1) * spacing);
                this.ctx.lineTo(hidden_x, (j + 1) * spacing);
            }

            this.ctx.stroke();
        }

        for (let i = 0; i < this.weights.length; ++i) {
            this.ctx.beginPath();
            this.ctx.arc(hidden_x, (i + 1) * spacing, 20, 0, 2 * Math.PI);

            if (this.weights[i] >= 0.5)
                this.ctx.fill();

            for (let j = 0; j < this.outputs.length; ++j) {
                this.ctx.moveTo(hidden_x, (i + 1) * spacing);
                this.ctx.lineTo(output_x, (j + 1) * spacing);
            }

            this.ctx.stroke();
        }

        for (let i = 0; i < this.outputs.length; ++i) {
            this.ctx.beginPath();
            this.ctx.arc(output_x, (i + 1) * spacing, 20, 0, 2 * Math.PI);

            if (this.outputs[i] >= 0.5)
                this.ctx.fill();

            this.ctx.stroke();
        }
    }
}
