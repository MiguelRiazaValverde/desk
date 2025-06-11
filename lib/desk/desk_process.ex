defmodule Desk.DeskProcess do
  use GenServer

  def start_link(desk_id) do
    GenServer.start_link(__MODULE__, desk_id, name: via(desk_id))
  end

  defp via(id), do: {:via, Registry, {Desk.DeskRegistry, id}}

  def init(desk_id) do
    Process.flag(:trap_exit, true)
    :timer.send_interval(2000, :check_pids)
    {:ok, %{desk_id: desk_id, data: %{}}}
  end

  def update_data(desk_id, user_id, data) do
    GenServer.call(via(desk_id), {:update_data, user_id, data, self()})
  end

  def remove_data(desk_id, user_id) do
    GenServer.call(via(desk_id), {:remove_data, user_id})
  end

  def get(desk_id) do
    GenServer.call(via(desk_id), :get)
  end

  def handle_call({:update_data, user_id, data, pid}, _from, state) do
    new_state = %{state | data: Map.put(state.data, user_id, %{data: data, pid: pid})}
    {:reply, :ok, new_state}
  end

  def handle_call({:remove_data, user_id}, _from, state) do
    Phoenix.PubSub.broadcast(
      Desk.PubSub,
      "desk_data:" <> state.desk_id,
      {:removed, user_id}
    )

    new_state = %{state | data: Map.delete(state.data, user_id)}
    {:reply, :ok, new_state}
  end

  def handle_info(:check_pids, state) do
    {alive, removed} =
      Enum.split_with(state.data, fn {_user_id, %{pid: pid}} -> Process.alive?(pid) end)

    Enum.each(removed, fn {user_id, _} ->
      Phoenix.PubSub.broadcast(
        Desk.PubSub,
        "desk_data:" <> state.desk_id,
        {:removed, user_id}
      )
    end)

    new_data = Enum.into(alive, %{})
    {:noreply, %{state | data: new_data}}
  end

  def handle_call(:get, _from, state) do
    data_only =
      state.data
      |> Enum.map(fn {user_id, %{data: data}} -> {user_id, data} end)
      |> Enum.into(%{})

    {:reply, data_only, state}
  end
end
