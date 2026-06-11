import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function bingoApiPlugin() {
  const handleBingoAPIs = (req, res, next) => {
    // 1. Upload JSON Tickets Base
    if (req.url === '/api/upload-json' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          if (Array.isArray(data)) {
            const filePath = path.resolve('public/bingo_tickets.json')
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, count: data.length }))
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid JSON array structure' }))
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }))
        }
      })
      return
    }

    // 2. Clear Tickets JSON Base
    if (req.url === '/api/clear-json' && req.method === 'POST') {
      try {
        const filePath = path.resolve('public/bingo_tickets.json')
        fs.writeFileSync(filePath, '[]')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
      return
    }

    // 3. Log a ticket download
    if (req.url === '/api/log-download' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const entry = JSON.parse(body)
          const filePath = path.resolve('public/bingo_downloads_log.json')
          let logs = []
          if (fs.existsSync(filePath)) {
            try {
              logs = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            } catch (err) {}
          }
          logs.push({
            ticketNumber: entry.ticketNumber,
            downloadedAt: entry.downloadedAt || new Date().toISOString()
          })
          fs.writeFileSync(filePath, JSON.stringify(logs, null, 2))
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        }
      })
      return
    }

    // 4. Clear/Reset Download Logs
    if (req.url === '/api/clear-downloads' && req.method === 'POST') {
      try {
        const filePath = path.resolve('public/bingo_downloads_log.json')
        fs.writeFileSync(filePath, '[]')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
      return
    }

    // 5. Save Authorized IDs
    if (req.url === '/api/save-authorized-ids' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const ids = JSON.parse(body)
          if (Array.isArray(ids)) {
            const filePath = path.resolve('public/bingo_authorized_ids.json')
            fs.writeFileSync(filePath, JSON.stringify(ids, null, 2))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true }))
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid array structure' }))
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid payload' }))
        }
      })
      return
    }

    // 6. Save Distributed Seller Rows
    if (req.url === '/api/save-seller-rows' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const rows = JSON.parse(body)
          if (Array.isArray(rows)) {
            const filePath = path.resolve('public/bingo_seller_rows.json')
            fs.writeFileSync(filePath, JSON.stringify(rows, null, 2))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true }))
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid array structure' }))
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid payload' }))
        }
      })
      return
    }

    // 7. Get Super Admins
    if (req.url === '/api/super-admins' && req.method === 'GET') {
      try {
        const filePath = path.resolve('public/bingo_super_admins.json')
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(data)
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify([]))
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
      return
    }

    // 8. Save Super Admins
    if (req.url === '/api/super-admins' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const list = JSON.parse(body)
          if (Array.isArray(list)) {
            const filePath = path.resolve('public/bingo_super_admins.json')
            fs.writeFileSync(filePath, JSON.stringify(list, null, 2))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true }))
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid array structure' }))
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid payload' }))
        }
      })
      return
    }

    next()
  }

  return {
    name: 'bingo-backend-api',
    configureServer(server) {
      server.middlewares.use(handleBingoAPIs)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleBingoAPIs)
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), bingoApiPlugin()],
  server: {
    host: true,
    watch: {
      ignored: ['**/public/bingo_*.json']
    }
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
