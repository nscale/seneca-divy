/**
 * Seneca Divy leverages the existing seneca methods to register a
 * pattern, but it exposes those registered patterns via a
 * Pin Definition Route (PDR). The divy proxy pulls the
 * definitions from the PDR and can then complete its setup.
 *
 * Seneca Divy overrides the current act/post functionality. This
 * is because every message needs to be pushed to the transport
 * layer to be resolve. Even if that means a message will come
 * directly back to the originating service. In this regard, the
 * resulting post is a hybrid client and therefore we block the
 * direct use of seneca.client.
 *
 * TODO:
 * - Need to provide config for the proxy call. Things like http(s), etc.
 * - Think through meta
 * - Error handling needs to be implemented. Just do HTTP/BOOM errors.
 */
const Fastify = require('fastify')
const Wreck = require('@hapi/wreck')
const _ = require('lodash')
const resolvePinTable = require('./lib/resolve-pin-table')

const PORT = process.env.PORT || 40000
const HOST = process.env.HOST || '127.0.0.1'
const PROXY_HTTP_PORT = process.env.PROXY_HTTP_PORT || 10000
const PROXY_HTTP_HOST = process.env.PROXY_HTTP_HOST || 'localhost'

function divy(opts) {
  const seneca = this
  const http = Fastify()
  const tu = seneca.export('transport/utils')
  const pintable = resolvePinTable(opts.listen)

  seneca.depends('promisify')
  seneca.message('init:divy', init)
  seneca.message('role:transport,cmd:client', client)
  seneca.message('role:seneca,cmd:close', close)

  async function init(msg) {
    const seneca = this

    http.route({ method: 'GET', url: '/pdt', handler: async () => pintable })

    http.route({
      method: 'POST',
      url: '/act',
      handler: async req => {
        const msg = tu.internalize_msg(seneca, req.body || {})
        const spec = {}

        try {
          spec.out = await seneca.post(msg)
        } catch (err) {
          spec.err
        }

        return tu.externalize_reply(seneca, spec.err, spec.out, spec.meta)
      }
    })

    await http.listen(PORT, HOST)

    seneca.client()
  }

  async function client(msg) {
    const seneca = this.root.delegate()

    const send = async function(msg, reply, meta) {
      const url = `http://${PROXY_HTTP_HOST}:${PROXY_HTTP_PORT}`
      const payload = tu.externalize_msg(seneca, msg, meta)

      let data
      try {
        const res = await Wreck.request('post', url, { payload })
        const body = await Wreck.read(res)
        data = parseJSON(body)
      } catch (error) {
        console.log(error)
        return seneca.reply(error)
      }

      // backwards compatibility with seneca-transport. TODO: clean up and remove
      if (!data.meta$) {
        data.meta$ = {
          id: meta.id
        }
      }

      seneca.reply(tu.internalize_reply(seneca, data))
    }

    return { send }
  }

  async function close(msg) {
    const seneca = this
    await http.close()
    await seneca.prior(msg)
  }
}

function onPreload() {
  const self = this

  self.listen = listenFactory

  function listenFactory(msg) {
    throw Error('divy doesnt support calling listen directly')
  }
}

function parseJSON(data) {
  if (!data) return

  var str = data.toString()

  try {
    return JSON.parse(str)
  } catch (e) {
    e.input = str
    return e
  }
}

module.exports = divy
module.exports.preload = onPreload
