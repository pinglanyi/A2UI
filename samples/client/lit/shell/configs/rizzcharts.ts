/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { AppConfig } from "./types.js";

export const config: AppConfig = {
  key: "rizzcharts",
  title: "Rizzcharts",
  background: `radial-gradient(
    at 0% 0%,
    light-dark(rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 100% 0%,
    light-dark(rgba(252, 211, 77, 0.3), rgba(251, 191, 36, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 100% 100%,
    light-dark(rgba(253, 230, 138, 0.3), rgba(217, 119, 6, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 0% 100%,
    light-dark(rgba(254, 243, 199, 0.3), rgba(180, 83, 9, 0.15)) 0px,
    transparent 50%
  ),
  linear-gradient(
    120deg,
    light-dark(#fffbeb, #1c1007) 0%,
    light-dark(#fef3c7, #292008) 100%
  )`,
  placeholder: "Show me a bar chart of quarterly sales data.",
  loadingText: [
    "Generating your chart...",
    "Processing data...",
    "Building visualization...",
    "Almost ready...",
  ],
  serverUrl: "http://localhost:10002",
};
