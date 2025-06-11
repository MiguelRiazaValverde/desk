defmodule Desk.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      DeskWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:desk, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Desk.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: Desk.Finch},
      {Registry, keys: :unique, name: Desk.DeskRegistry},
      # Start a worker by calling: Desk.Worker.start_link(arg)
      # {Desk.Worker, arg},
      # Start to serve requests, typically the last entry
      Desk.DeskSupervisor,
      DeskWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Desk.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    DeskWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
