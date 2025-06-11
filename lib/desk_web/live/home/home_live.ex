defmodule DeskWeb.HomeLive do
  use DeskWeb, :live_view

  def mount(_params, _session, socket) do
    random_desk =
      1..8
      |> Enum.map(fn _ -> Enum.random(?a..?z) end)
      |> to_string()

    {:ok, assign(socket, random_desk: random_desk)}
  end
end
