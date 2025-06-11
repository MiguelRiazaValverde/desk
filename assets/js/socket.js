import { Socket } from "phoenix"


export class SocketDesk extends EventTarget {
    constructor(user) {
        super();

        let socket = new Socket("/socket", { params: { userToken: "123" } });
        socket.connect();

        const path = window.location.pathname;
        const desk = path.substring(path.lastIndexOf('/') + 1);
        let channel = socket.channel(`desk:${desk}`, { user });

        channel.on("note_on", payload => {
            this.dispatchEvent(new CustomEvent("note_on", { detail: payload }));
        });

        channel.on("note_off", payload => {
            this.dispatchEvent(new CustomEvent("note_off", { detail: payload }));
        });

        channel.on("update_params", payload => {
            this.dispatchEvent(new CustomEvent("update_params", { detail: payload }));
        });

        channel.on("update_filter", payload => {
            this.dispatchEvent(new CustomEvent("update_filter", { detail: payload }));
        });

        channel.on("id", payload => {
            this.dispatchEvent(new CustomEvent("id", { detail: payload }));
            this.id = payload.id;
        });

        channel.join()
            .receive("ok", resp => {
                channel.push("id");
            })
            .receive("error", resp => { console.error("Unable to join", resp) });

        this.id = -1;
        this.channel = channel;
    }

    on(note) {
        this.channel.push("note_on", {
            note
        });
    }

    off(note) {
        this.channel.push("note_off", {
            note
        });
    }

    updateParams(params) {
        this.channel.push("update_params", params);
    }

    updateFilter(filter) {
        this.channel.push("update_filter", filter);
    }
}
