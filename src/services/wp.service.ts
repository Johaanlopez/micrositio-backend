import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { config } from '../config'

type CacheEntry = { expiresAt: number; data: any }

class WPService {
  private client: AxiosInstance
  private token: string | null = null
  private cache = new Map<string, CacheEntry>()
  private CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.client = axios.create({
      baseURL: config.wp.baseUrl,
      timeout: 8000
    })

    // If basic or static jwt configured in config, seed defaults
    if (config.wp.authType === 'basic' && config.wp.basicUser && config.wp.basicPass) {
      this.client.defaults.auth = { username: config.wp.basicUser, password: config.wp.basicPass }
    }
    if (config.wp.authType === 'jwt' && config.wp.jwtToken) {
      this.token = config.wp.jwtToken
    }

    // Request interceptor: add Authorization header automatically when token present
    this.client.interceptors.request.use((req: InternalAxiosRequestConfig) => {
      const t = this.token
      if (t) {
        req.headers = req.headers || {}
        // headers typing in newer axios may require string keys
        ;(req.headers as any)['Authorization'] = `Bearer ${t}`
      }
      return req
    })
  }

  setToken(token: string | null) {
    this.token = token
  }

  private cacheKey(path: string, params?: any, token?: string | null) {
    const p = params ? JSON.stringify(params) : ''
    const t = token || this.token || ''
    return `${path}|${p}|${t}`
  }

  private getCached(key: string) {
    const e = this.cache.get(key)
    if (!e) return null
    if (Date.now() > e.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return e.data
  }

  private setCached(key: string, data: any) {
    this.cache.set(key, { expiresAt: Date.now() + this.CACHE_TTL_MS, data })
  }

  private handleAxiosError(err: any) {
    if (err.response) {
      const status = err.response.status
      if (status === 401) throw new Error('Unauthorized (WP)')
      if (status === 403) throw new Error('Forbidden (WP)')
      if (status === 404) throw new Error('Not found (WP)')
      const msg = err.response.data?.message || err.message
      throw new Error(`WP API error: ${msg}`)
    }
    throw err
  }

  // Get posts (cached)
  async getPosts(token?: string) {
    const key = this.cacheKey('/wp/v2/posts', undefined, token)
    const cached = this.getCached(key)
    if (cached) return cached

    const prevToken = this.token
    if (token) this.setToken(token)
    try {
      const resp = await this.client.get('/wp/v2/posts')
      this.setCached(key, resp.data)
      return resp.data
    } catch (err: any) {
      this.handleAxiosError(err)
    } finally {
      if (token) this.setToken(prevToken)
    }
  }

  // Get page by slug (cached). Returns first matching page or throws 404
  async getPage(slug: string, token?: string) {
    const path = `/wp/v2/pages`
    const params = { slug }
    const key = this.cacheKey(path, params, token)
    const cached = this.getCached(key)
    if (cached) return cached

    const prevToken = this.token
    if (token) this.setToken(token)
    try {
      const resp = await this.client.get(path, { params })
      const items = resp.data
      if (!items || items.length === 0) throw new Error('Not found (WP)')
      const page = items[0]
      this.setCached(key, page)
      return page
    } catch (err: any) {
      this.handleAxiosError(err)
    } finally {
      if (token) this.setToken(prevToken)
    }
  }

  // Get protected content that requires auth (no caching)
  async getProtectedContent(postId: number, token?: string) {
    const prevToken = this.token
    if (token) this.setToken(token)
    try {
      const resp = await this.client.get(`/wp/v2/posts/${postId}`)
      return resp.data
    } catch (err: any) {
      this.handleAxiosError(err)
    } finally {
      if (token) this.setToken(prevToken)
    }
  }
}

export const wpService = new WPService()
