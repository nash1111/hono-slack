import { Hono } from 'hono'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateSlackSignature } from './middleware/validateSlackSignature'

interface Env {
  GEMINI_API_KEY: string
  SLACK_SIGNING_SECRET: string
}
interface Variables {
  parsedBody?: Record<string, string>
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/slack', validateSlackSignature(c => c.env.SLACK_SIGNING_SECRET))

app.post('/slack', async (c) => {
  try {
    const parsedBody = c.get('parsedBody') as Record<string, string>
    const question = parsedBody.text || 'No question provided'
    const response_url = parsedBody.response_url

    // Immediately return a processing response
    c.executionCtx.waitUntil((async () => {
      // Asynchronously call the model
      const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
      const result = await model.generateContent(question)
      const finalText = `${question}\n${result.response.text()}`

      // After processing, POST to Slack's response_url to update the message
      await fetch(response_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: "in_channel",
          text: finalText
        })
      })
    })())

    return c.json({
      response_type: "ephemeral",
      text: `Your question: "${question}" is being processed. Please wait for the response.`
    })
  } catch (error) {
    return c.json({ error: 'error occurred' }, 500)
  }
})

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx)
  }
}
