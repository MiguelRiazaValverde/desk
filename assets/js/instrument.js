let zCounter = 0;

function moveElemHandler(el) {
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    el.addEventListener("mousedown", (e) => {
        if (e.target !== el) return;
        isDragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        el.style.cursor = "grabbing";
        zCounter++;
        el.style.zIndex = zCounter;
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        el.style.cursor = "grab";
    });
}


function knobController(knobEl, min, max, getValue, setValue) {
    let startY = 0;
    let value = 0;
    let dragging = false;
    const sensitivity = 0.005;

    const clamp = (v) => Math.min(1, Math.max(0, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    const onMouseMove = (e) => {
        if (!dragging) return;
        const dy = startY - e.clientY;
        let newValue = clamp(value + dy * sensitivity);
        setValue(lerp(min, max, newValue));
        value = newValue;
        knobEl.style.transform = `rotate(${300 * value + 30}deg)`;
        startY = e.clientY;
    };

    const onMouseUp = () => {
        dragging = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    };

    const onMouseDown = (e) => {
        e.stopPropagation();
        dragging = true;
        startY = e.clientY;
        value = clamp(getValue());
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    knobEl.addEventListener("mousedown", onMouseDown);
}



export class Instrument extends EventTarget {

    static instruments = {};

    static addInstrument(id, instrument) {
        this.instruments[id] = instrument;
    }

    static getInstrument(id) {
        return this.instruments[id];
    }

    static deleteInstrument(id) {
        delete this.instruments[id];
    }

    constructor(element, params, filter) {
        super();
        moveElemHandler(element);
        this.element = element;
        this.filter = new Tone.Filter({
            type: "lowpass",
            frequency: filter.freq,
            rolloff: -12,
            Q: filter.q || 1
        }).toDestination();
        this.synth = new Tone.PolySynth(Tone.Synth, {
            maxPolyphony: 8,
            voice: {
                modulationIndex: 1,
                envelope: params
            }
        }).connect(this.filter);
        this.notes = {};

        this.updateParams(this.synth.get().envelope);
        this.element.querySelector(".freq").disabled = true;
    }

    editable(socket) {
        if (!this.element.classList.contains("editable")) {
            this.enableKnobs();
            this.enableFilter();
            this.element.classList.add("editable");
            this.addEventListener("update_params", ({ detail: payload }) => {
                socket.updateParams(payload);
            });
            this.addEventListener("update_filter", ({ detail: payload }) => {
                socket.updateFilter(payload);
            });
            this.element.querySelector(".freq").disabled = false;
        }
    }

    enableKnobs() {
        knobController(
            this.element.querySelector(".knob-attack"),
            0,
            2,
            () => this.synth.get().envelope.attack,
            (attack) => this.broadcastParams({ attack })
        );
        knobController(
            this.element.querySelector(".knob-decay"),
            0,
            2,
            () => this.synth.get().envelope.decay,
            (decay) => this.broadcastParams({ decay })
        );
        knobController(
            this.element.querySelector(".knob-sustain"),
            0,
            1,
            () => this.synth.get().envelope.sustain,
            (sustain) => this.broadcastParams({ sustain })
        );
        knobController(
            this.element.querySelector(".knob-release"),
            0,
            2,
            () => this.synth.get().envelope.release,
            (release) => this.broadcastParams({ release })
        );
    }

    enableFilter() {
        const elem = this.element.querySelector(".freq");

        elem.addEventListener("input", (e) => {
            this.broadcastFilter({ freq: e.target.value });
        });

        elem.onmousedown = e => {
            e.stopPropagation();
        };
    }

    broadcastFilter(filter) {
        this.dispatchEvent(new CustomEvent("update_filter", { detail: filter }));
    }

    broadcastParams(params) {
        params = { ...this.synth.get().envelope, ...params };
        this.dispatchEvent(new CustomEvent("update_params", { detail: params }));
    }

    on(note) {
        if (this.notes[note])
            return;
        this.notes[note] = true;
        this.synth.triggerAttack(note);
    }

    off(note) {
        delete this.notes[note];
        this.synth.triggerRelease(note);
    }

    updateParams(params) {
        this.synth.set({ envelope: params });

        this.element.querySelector(".knob-attack").style.transform = `rotate(${300 * params.attack / 2 + 30}deg)`;
        this.element.querySelector(".knob-decay").style.transform = `rotate(${300 * params.decay / 2 + 30}deg)`;
        this.element.querySelector(".knob-sustain").style.transform = `rotate(${300 * params.sustain + 30}deg)`;
        this.element.querySelector(".knob-release").style.transform = `rotate(${300 * params.release / 2 + 30}deg)`;
    }

    updateFilter(filter) {
        this.filter.frequency.value = filter.freq;
        // this.filter.Q.value = filter.q;

        this.element.querySelector(".freq").value = filter.freq;
    }
}

