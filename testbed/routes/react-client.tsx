import React from "react";
import { App } from "./react-page";
import { hydrate } from "react-dom";

const app = document.getElementById("app");
hydrate(<App />, app);
