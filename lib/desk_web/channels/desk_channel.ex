defmodule DeskWeb.DeskChannel do
  use Phoenix.Channel

  def join("desk:" <> desk_id, %{"user" => user}, socket) do
    id = System.unique_integer([:positive])
    send(self(), :after_join)

    Phoenix.PubSub.subscribe(Desk.PubSub, "desk_data:" <> desk_id)

    case Registry.lookup(Desk.DeskRegistry, desk_id) do
      [] -> Desk.DeskSupervisor.start_desk(desk_id)
      _ -> :ok
    end

    envelope = %{}
    filter = %{freq: 1000, q: 1}

    Desk.DeskProcess.update_data(desk_id, id, %{
      desk: desk_id,
      id: id,
      user: user,
      envelope: envelope,
      filter: filter
    })

    Phoenix.PubSub.broadcast(
      Desk.PubSub,
      "desk_data:" <> desk_id,
      :updated
    )

    {:ok,
     assign(socket, %{
       desk: desk_id,
       user: user,
       id: id,
       envelope: envelope,
       filter: filter
     })}
  end

  def handle_info(:after_join, socket) do
    broadcast!(socket, "joined", %{
      desk: socket.assigns.desk,
      user: socket.assigns.user,
      id: socket.assigns.id
    })

    {:noreply, socket}
  end

  def handle_info(:updated, socket) do
    {:noreply, socket}
  end

  def handle_info({:removed, id}, socket) do
    push(socket, "left", %{
      desk: socket.assigns.desk,
      id: id
    })

    {:noreply, socket}
  end

  def handle_in("update_filter", filter, socket) do
    Desk.DeskProcess.update_data(
      socket.assigns.desk,
      socket.assigns.id,
      Map.merge(
        %{
          user: socket.assigns.user,
          id: socket.assigns.id,
          envelope: socket.assigns.envelope
        },
        %{filter: filter}
      )
    )

    broadcast!(socket, "update_filter", %{
      desk: socket.assigns.desk,
      user: socket.assigns.user,
      id: socket.assigns.id,
      filter: filter
    })

    {:noreply, socket}
  end

  def handle_in("update_params", params, socket) do
    Desk.DeskProcess.update_data(
      socket.assigns.desk,
      socket.assigns.id,
      Map.merge(
        %{
          user: socket.assigns.user,
          id: socket.assigns.id,
          filter: socket.assigns.filter
        },
        %{envelope: params}
      )
    )

    broadcast!(socket, "update_params", %{
      desk: socket.assigns.desk,
      user: socket.assigns.user,
      id: socket.assigns.id,
      params: params
    })

    {:noreply, socket}
  end

  def handle_in("note_on", %{"note" => note}, socket) do
    broadcast!(socket, "note_on", %{
      note: note,
      desk: socket.assigns.desk,
      user: socket.assigns.user,
      id: socket.assigns.id
    })

    {:noreply, socket}
  end

  def handle_in("note_off", %{"note" => note}, socket) do
    broadcast!(socket, "note_off", %{
      note: note,
      desk: socket.assigns.desk,
      user: socket.assigns.user,
      id: socket.assigns.id
    })

    {:noreply, socket}
  end

  def handle_in("id", _params, socket) do
    push(socket, "id", %{
      id: socket.assigns.id
    })

    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    Desk.DeskProcess.remove_data(socket.assigns.desk, socket.assigns.id)

    Phoenix.PubSub.broadcast(
      Desk.PubSub,
      "desk_data:" <> socket.assigns.desk,
      :updated
    )

    broadcast!(socket, "left", %{
      desk: socket.assigns.desk,
      user: socket.assigns.user,
      id: socket.assigns.id
    })

    :ok
  end
end
