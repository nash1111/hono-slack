import { MiddlewareHandler, Context } from 'hono'

export const validateApiKey = (getApiKey: (c: Context) => string): MiddlewareHandler => {
  return async (c, next) => {
    const authKey = c.req.header('x-api-key')
    const expectedKey = getApiKey(c)
    if (!authKey || authKey !== expectedKey) {
      return c.json({ error: 'Invalid API key' }, 401)
    }
    await next()
  }
}