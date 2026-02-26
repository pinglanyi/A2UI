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

import { IncomingMessage, ServerResponse } from "http";
import { Plugin, ViteDevServer } from "vite";
import OpenAI from "openai";
import { v0_8 } from "@a2ui/lit";
import { createA2UIPrompt, createImageParsePrompt } from "./prompts";

// TODO: Reenable.
// import ServerToClientMessage from "../schemas/a2ui-message.js";

// Default model to use when AI_MODEL is not set and no Gemini key is detected
const DEFAULT_OPENAI_MODEL = "gpt-4o";
// Default model for Gemini backward compatibility via Google's OpenAI-compatible endpoint
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type ContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

/**
 * Converts Google GenAI-style content parts to OpenAI chat content parts.
 * - { text: "..." } → { type: "text", text: "..." }
 * - { inlineData: { mimeType, data } } → { type: "image_url", image_url: { url: "data:..." } }
 */
function convertPartsToOpenAIContent(
  parts: ContentPart[]
): OpenAI.ChatCompletionContentPart[] {
  return parts.map((part) => {
    if ("inlineData" in part) {
      return {
        type: "image_url" as const,
        image_url: {
          url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        },
      };
    }
    return {
      type: "text" as const,
      text: part.text,
    };
  });
}

let catalog: v0_8.Types.ClientCapabilitiesDynamic | null = null;
let client: OpenAI | null = null;

export const plugin = (): Plugin => {
  // Support OPENAI_API_KEY (primary) or GEMINI_API_KEY (legacy backward compatibility)
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No API key found. Please set OPENAI_API_KEY in your .env file.\n" +
        "For vLLM or other OpenAI-compatible APIs also set OPENAI_BASE_URL.\n" +
        "Legacy: GEMINI_API_KEY is still accepted for backward compatibility."
    );
  }

  return {
    name: "custom-ai-handler",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/a2ui",
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          // Lazily initialize the OpenAI client so env vars are available
          if (!client) {
            const key =
              process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "";
            // Allow custom base URL for vLLM and other OpenAI-compatible endpoints.
            // When only GEMINI_API_KEY is set (legacy mode) automatically point to
            // Google's OpenAI-compatible endpoint.
            const baseURL =
              process.env.OPENAI_BASE_URL ||
              (process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY
                ? "https://generativelanguage.googleapis.com/v1beta/openai/"
                : undefined);
            client = new OpenAI({ apiKey: key, baseURL });
          }

          // Model selection priority:
          // 1. AI_MODEL env var (explicit user choice)
          // 2. Default for legacy Gemini key usage
          // 3. DEFAULT_OPENAI_MODEL fallback
          const model =
            process.env.AI_MODEL ||
            (process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY
              ? DEFAULT_GEMINI_MODEL
              : DEFAULT_OPENAI_MODEL);

          if (req.method === "POST") {
            let contents = "";

            req.on("data", (chunk) => {
              contents += chunk.toString();
            });

            req.on("end", async () => {
              try {
                const payload = JSON.parse(
                  contents
                ) as v0_8.Types.A2UIClientEventMessage;
                if (payload.clientUiCapabilities || payload.userAction) {
                  if (payload.clientUiCapabilities) {
                    if ("dynamicCatalog" in payload.clientUiCapabilities) {
                      catalog = payload.clientUiCapabilities.dynamicCatalog;

                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.end(
                        JSON.stringify({
                          role: "model",
                          parts: [{ text: "Dynamic Catalog Received" }],
                        })
                      );
                      return;
                    }
                  } else if (payload.userAction) {
                    // TODO: Handle user actions.
                    return;
                  }
                } else {
                  // Other payload - assume this is a user request.
                  if (!payload.request || !catalog) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                      JSON.stringify({
                        error: `Invalid message - No payload or catalog`,
                      })
                    );
                    return;
                  }

                  if (v0_8.Data.Guards.isObject(payload.request)) {
                    const request = payload.request as {
                      imageData?: string;
                      instructions: string;
                    };

                    let imageDescription = "";
                    if (
                      request.imageData &&
                      request.imageData.startsWith("data:")
                    ) {
                      const mimeType = /data:(.*);/
                        .exec(request.imageData)
                        ?.at(1);
                      if (!mimeType) {
                        throw new Error("Invalid inline data");
                      }
                      const data = request.imageData.substring(
                        `data:${mimeType};base64,`.length
                      );
                      const contentPart = {
                        inlineData: {
                          mimeType,
                          data,
                        },
                      };

                      const imagePromptData = createImageParsePrompt(
                        catalog,
                        contentPart
                      );

                      const imageResponse =
                        await client.chat.completions.create({
                          model,
                          messages: [
                            {
                              role: "system",
                              content: `You are working as part of an AI system, so no chit-chat and
                        no explaining what you're doing and why. DO NOT start with
                        "Okay", or "Alright" or any preambles. Just the output,
                        please.`,
                            },
                            {
                              role: "user",
                              content: convertPartsToOpenAIContent(
                                imagePromptData.parts as ContentPart[]
                              ),
                            },
                          ],
                        });
                      imageDescription =
                        imageResponse.choices[0]?.message?.content ?? "";
                    }

                    const a2uiPromptData = createA2UIPrompt(
                      catalog,
                      imageDescription,
                      request.instructions
                    );

                    const a2uiResponse = await client.chat.completions.create({
                      model,
                      messages: [
                        {
                          role: "system",
                          content: `Please return a valid array
                        necessary to satisfy the user request. If no data is
                        provided create some. If there are any URLs you must
                        make them absolute and begin with a /.

                        Nothing should ever be loaded from a remote source.

                        You are working as part of an AI system, so no chit-chat and
                        no explaining what you're doing and why. DO NOT start with
                        "Okay", or "Alright" or any preambles. Just the output,
                        please.

                        ULTRA IMPORTANT: *Just* return the A2UI Protocol
                        Message object, do not wrap it in markdown. Just the object
                        please, nothing else!`,
                        },
                        {
                          role: "user",
                          content: convertPartsToOpenAIContent(
                            a2uiPromptData.parts as ContentPart[]
                          ),
                        },
                      ],
                    });

                    const responseText =
                      a2uiResponse.choices[0]?.message?.content ?? "";
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                      JSON.stringify({
                        role: "model",
                        parts: [{ text: responseText }],
                      })
                    );
                  } else {
                    throw new Error("Expected request to be an object");
                  }
                }
              } catch (err) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: `Invalid message - ${err}`,
                  })
                );
              }
            });

            return;
          } else {
            next();
          }
        }
      );
    },
  };
};
