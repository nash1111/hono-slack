import { Hono } from "hono";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateSlackSignature } from "./middleware/validateSlackSignature";
import OpenAI from "openai";

interface Env {
  GEMINI_API_KEY: string;
  SLACK_SIGNING_SECRET: string;
  OPEN_AI_API_KEY: string;
}

interface Variables {
  parsedBody?: Record<string, string>;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("/slack", validateSlackSignature((c) => c.env.SLACK_SIGNING_SECRET));
app.use("/openai/*", validateSlackSignature((c) => c.env.SLACK_SIGNING_SECRET));

app.post("/openai/4o", async (c) => {
  try {
    const parsedBody = c.get("parsedBody") as Record<string, string>;
    const question = parsedBody.text || "No question provided";
    const response_url = parsedBody.response_url;

    c.executionCtx.waitUntil((async () => {
      const openai = new OpenAI({
        apiKey: c.env.OPEN_AI_API_KEY,
      });

      const result = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: question }],
      });

      const finalText = `${question}\n${
        result.choices[0]?.message.content || "No response from model"
      }`;

      await fetch(response_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "in_channel",
          text: finalText,
        }),
      });
    })());

    return c.json({
      response_type: "ephemeral",
      text:
        `Your question: "${question}" is being processed with GPT-4o. Please wait for the response.`,
    });
  } catch (error) {
    return c.json({ error: "error occurred with GPT-4o" }, 500);
  }
});

app.post("/openai/o1-pro", async (c) => {
  try {
    const parsedBody = c.get("parsedBody") as Record<string, string>;
    const question = parsedBody.text || "No question provided";
    const response_url = parsedBody.response_url;

    c.executionCtx.waitUntil((async () => {
      try {
        const openai = new OpenAI({
          apiKey: c.env.OPEN_AI_API_KEY,
        });

        const result = await openai.responses.create({
          model: "o1-pro",
          input: question,
        });

        const responseContent = result.output_text || "No response from model";
        const finalText = `${question}\n${responseContent}`;

        await fetch(response_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            response_type: "in_channel",
            text: finalText,
          }),
        });
      } catch (error) {
        console.error("Error in waitUntil:", error);
        await fetch(response_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            response_type: "ephemeral",
            text: "An error occurred while processing your request.",
          }),
        });
      }
    })());

    return c.json({
      response_type: "ephemeral",
      text:
        `Your question: "${question}" is being processed with o1-pro. Please wait for the response.`,
    });
  } catch (error) {
    console.error("Error in main handler:", error);
    return c.json({ error: "An error occurred with o1-pro" }, 500);
  }
});

app.post("/slack", async (c) => {
  try {
    const parsedBody = c.get("parsedBody") as Record<string, string>;
    const question = parsedBody.text || "No question provided";
    const response_url = parsedBody.response_url;

    c.executionCtx.waitUntil((async () => {
      const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(question);
      const finalText = `${question}\n${result.response.text()}`;

      await fetch(response_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "in_channel",
          text: finalText,
        }),
      });
    })());

    return c.json({
      response_type: "ephemeral",
      text:
        `Your question: "${question}" is being processed. Please wait for the response.`,
    });
  } catch (error) {
    return c.json({ error: "error occurred" }, 500);
  }
});

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
};
