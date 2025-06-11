defmodule DeskWeb.UserSocket do
  use Phoenix.Socket

  channel "desk:*", DeskWeb.DeskChannel

  def connect(_params, socket, _connect_info), do: {:ok, socket}
  def id(_socket), do: nil
end
