const { expect, fail } = require('code')
const Lab = require('lab')
const { after, before, describe, it } = (exports.lab = Lab.script())

const Http = require('http')
const Wreck = require('@hapi/wreck')
const Seneca = require('seneca')
const Divy = require('../seneca-divy')

describe('seneca divy', () => {
  it('exposes pin table via PDR', async () => {
    const s = makeInstance()
      .message('a:b', () => ({ ok: true }))
      .use(Divy, {
        listen: [{ pin: 'a:b' }]
      })

    const seneca = await s.ready()

    const res = await Wreck.request('get', 'http://127.0.0.1:40000/pdt')
    const body = await Wreck.read(res)
    const data = JSON.parse(body.toString())

    expect(data).to.equal([{ pin: 'a:b', model: 'consume', type: 'http' }])
    s.close()
  })

  it('can listen for messages', async () => {
    const s = makeInstance()
      .message('a:b', async function ab() {
        return { ok: true }
      })
      .use(Divy, {
        listen: [{ pin: 'a:b' }]
      })

    await s.ready()

    const res = await Wreck.request('post', 'http://127.0.0.1:40000/act', {
      payload: { a: 'b' }
    })
    const body = await Wreck.read(res)
    const out = JSON.parse(body.toString())

    expect(out).to.equal({ ok: true })
    s.close()
  })

  it('doenst intercept local messages', async () => {
    const s = makeInstance()
      .message('a:b', async function ab() {
        const out = this.post('c:d')
        return out
      })
      .message('c:d', async function cd() {
        return { ok: true }
      })
      .use(Divy, {
        listen: [{ pin: 'a:b' }]
      })

    await s.ready()

    const res = await Wreck.request('post', 'http://127.0.0.1:40000/act', {
      payload: { a: 'b' }
    })
    const body = await Wreck.read(res)
    const out = JSON.parse(body.toString())

    expect(out).to.equal({ ok: true })
    s.close()
  })

  it('intercepts non local messages', async () => {
    const s = makeInstance()
      .message('a:b', async function ab() {
        const out = await this.post('c:d')
        return out
      })
      .use(Divy, {
        listen: [{ pin: 'a:b' }]
      })

    await s.ready()

    const server = await createServer('ok', 10000)

    const res = await Wreck.request('post', 'http://127.0.0.1:40000/act', {
      payload: { a: 'b' }
    })
    const body = await Wreck.read(res)
    const out = JSON.parse(body.toString())

    expect(out).to.equal({ ok: true })
    s.close()
    server.close()
  })

  it('fails if you try to call listen', async () => {
    const s = makeInstance().use(Divy)

    try {
      s.listen(9000)
    } catch (error) {
      expect(error).to.exist()
      s.close()
      return
    }

    fail('should have prevented direct seneca.listen call')
    s.close()
  })
})

function makeInstance() {
  return Seneca({
    legacy: {
      error: false,
      transport: false
    }
  })
    .test()
    .use('promisify')
}

function createServer(handler, opts = {}) {
  if (typeof handler !== 'function') {
    if (handler === 'echo') {
      handler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        req.pipe(res)
      }
    } else if (handler === 'fail') {
      handler = (req, res) => {
        res.socket.destroy()
      }
    } else if (handler === 'ok') {
      handler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('{"ok":true}')
      }
    } else {
      handler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(internals.payload)
      }
    }
  }

  const server = Http.createServer(handler)

  return new Promise(resolve => {
    server.listen(Object.assign({ host: '127.0.0.1', port: 10000 }, opts), () =>
      resolve(server)
    )
  })
}
