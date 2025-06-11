defmodule DeskWeb.InstrumentComponent do
  use DeskWeb, :live_component

  def render(assigns) do
    ~H"""
    <div
      id={"instrument-#{@id}"}
      phx-hook="Instrument"
      class="instrument"
      data-params={Jason.encode!(@params)}
    >
      <div class="user">{@params.user}</div>
      
      <div class="envelope">
        <div class="knob knob-attack"></div>
        
        <div class="knob knob-decay"></div>
        
        <div class="knob knob-sustain"></div>
        
        <div class="knob knob-release"></div>
      </div>
      
      <div class="filter">
        <input type="range" class="freq" min="100" max="2000" value="800" step="10" />
      </div>
    </div>
    """
  end

  def mount(socket) do
    {:ok, socket}
  end
end
