import "phoenix_html"
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"
import topbar from "../vendor/topbar"

import { SocketDesk } from "./socket";
import { Keyboard } from "./keyboard";
import { Instrument } from "./instrument";








let user = "";
while (!user.trim())
  user = prompt("Nickname:");

const socket = new SocketDesk(user);
const keyboard = new Keyboard(socket);

socket.addEventListener("note_on", ({ detail: payload }) => {
  const instrument = Instrument.getInstrument(payload.id);
  if (instrument)
    instrument.on(payload.note);
});

socket.addEventListener("note_off", ({ detail: payload }) => {
  const instrument = Instrument.getInstrument(payload.id);
  if (instrument)
    instrument.off(payload.note);
});

socket.addEventListener("id", ({ detail: payload }) => {
  const instrument = Instrument.getInstrument(payload.id);
  if (instrument)
    instrument.editable(socket);
});

socket.addEventListener("update_params", ({ detail: payload }) => {
  Instrument.getInstrument(payload.id).updateParams(payload.params);
});

socket.addEventListener("update_filter", ({ detail: payload }) => {
  Instrument.getInstrument(payload.id).updateFilter(payload.filter);
});



const Hooks = {}

Hooks.Instrument = {
  mounted() {
    const el = this.el;
    this.params = JSON.parse(el.dataset.params);
    const instrument = new Instrument(this.el, this.params.envelope, this.params.filter);
    Instrument.addInstrument(this.params.id, instrument);
    if (this.params.id == socket.id)
      instrument.editable(socket);
  },
  updated() {
    console.log("updated");
  },
  destroyed() {
    Instrument.deleteInstrument(this.params.id);
  },
}







let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
let liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: { _csrf_token: csrfToken },
  hooks: Hooks
})

// Show progress bar on live navigation and form submits
topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" })
window.addEventListener("phx:page-loading-start", _info => topbar.show(300))
window.addEventListener("phx:page-loading-stop", _info => topbar.hide())















liveSocket.connect()
window.liveSocket = liveSocket







