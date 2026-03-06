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
  key: "orchestrator",
  title: "A2UI Orchestrator",
  background: `radial-gradient(
    at 0% 0%,
    light-dark(rgba(139, 92, 246, 0.3), rgba(109, 40, 217, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 100% 0%,
    light-dark(rgba(167, 139, 250, 0.3), rgba(124, 58, 237, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 100% 100%,
    light-dark(rgba(196, 181, 253, 0.3), rgba(91, 33, 182, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 0% 100%,
    light-dark(rgba(221, 214, 254, 0.3), rgba(76, 29, 149, 0.15)) 0px,
    transparent 50%
  ),
  linear-gradient(
    120deg,
    light-dark(#f5f3ff, #150e2a) 0%,
    light-dark(#ede9fe, #1e1533) 100%
  )`,
  placeholder: "What can you help me with?",
  loadingText: [
    "Routing your request...",
    "Consulting agents...",
    "Gathering results...",
    "Almost there...",
  ],
  serverUrl: "http://localhost:10002",
};
