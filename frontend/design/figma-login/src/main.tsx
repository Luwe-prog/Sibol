import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import type { LoginState } from "./App"
import "./index.css"

const states: LoginState[] = [
  "empty",
  "focused",
  "submitting",
  "wrong-details",
  "deactivated",
  "too-many-tries",
  "server-unreachable",
]
const requestedState = new URLSearchParams(window.location.search).get("state")
const state = states.includes(requestedState as LoginState)
  ? requestedState as LoginState
  : "empty"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App state={state} />
  </React.StrictMode>,
)
