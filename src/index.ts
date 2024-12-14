import { Hono } from 'hono'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateApiKey } from './middleware/validateApiKey'

interface Env {
  GEMINI_API_KEY: string
  API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', validateApiKey(c => c.env.API_KEY))

app.post('/ask', async (c) => {
  try {
    const { question } = await c.req.json<{ question: string }>()
    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    const result = await model.generateContent(question)
    const response = result.response
    return c.json({ answer: response.text() })
  } catch (error) {
    return c.json({ error: 'error occurred' }, 500)
  }
})

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx)
  }
}