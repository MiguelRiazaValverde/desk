

export class Keyboard {

    static layout = {
        upper: { keys: "q2w3er5t6y7ui9o0p".split(''), octaveOffset: 1 },
        down: { keys: "zsxdcvgbhnjm,l.".split(''), octaveOffset: 0 },
    };

    constructor(socket) {
        this.octave = 3;

        const keysPressed = new Set();

        document.addEventListener("keydown", (event) => {
            if (keysPressed.has(event.key))
                return;

            keysPressed.add(event.key);

            for (const layout of [Keyboard.layout.upper, Keyboard.layout.down]) {
                let index = layout.keys.indexOf(event.key);
                if (index !== -1) {
                    let note = 12 * layout.octaveOffset + index + this.octave * 12;
                    socket.on(Tone.Frequency(note, "midi").toNote());
                    break;
                }
            }
        });

        document.addEventListener("keyup", (event) => {
            keysPressed.delete(event.key);
            for (const layout of [Keyboard.layout.upper, Keyboard.layout.down]) {
                let index = layout.keys.indexOf(event.key);
                if (index !== -1) {
                    let note = 12 * layout.octaveOffset + index + this.octave * 12;
                    socket.off(Tone.Frequency(note, "midi").toNote());
                    break;
                }
            }
        });
    }
}