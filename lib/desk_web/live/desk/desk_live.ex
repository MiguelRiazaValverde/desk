defmodule DeskWeb.DeskLive do
  use DeskWeb, :live_view

  def mount(%{"desk" => desk_id}, _session, socket) do
    case Registry.lookup(Desk.DeskRegistry, desk_id) do
      [] -> Desk.DeskSupervisor.start_desk(desk_id)
      _ -> :ok
    end

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Desk.PubSub, "desk_data:" <> desk_id)
    end

    {:ok,
     assign(socket,
       desk_id: desk_id,
       data: Desk.DeskProcess.get(desk_id)
     )}
  end

  def handle_info(:updated, socket) do
    {:noreply, assign(socket, data: Desk.DeskProcess.get(socket.assigns.desk_id))}
  end

  def handle_info({:removed, id}, socket) do
    {:noreply, socket}
  end
end
