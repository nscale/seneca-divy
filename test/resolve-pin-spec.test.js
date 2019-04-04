const { expect, fail } = require('code')
const Lab = require('lab')
const { after, before, describe, it } = (exports.lab = Lab.script())

const resolve = require('../lib/resolve-pin-table')

describe('pin spec resolver', () => {
  it('can resolve with listeners', async () => {
    const spec = resolve([
      { pin: 'a:b', model: 'observe' },
      { pin: 'c:d', type: 'redis' }
    ])

    expect(spec[0]).to.exist()
    expect(spec[0].pin).to.equal('a:b')
    expect(spec[0].model).to.equal('observe')
    expect(spec[0].type).to.equal('http')
    expect(spec[1]).to.exist()
    expect(spec[1].pin).to.equal('c:d')
    expect(spec[1].model).to.equal('consume')
    expect(spec[1].type).to.equal('redis')
  })

  it('supports pins', async () => {
    const spec = resolve([{ pins: ['a:b', 'c:d'], model: 'observe' }])

    expect(spec[0]).to.exist()
    expect(spec[0].pin).to.equal('a:b')
    expect(spec[0].model).to.equal('observe')
    expect(spec[0].type).to.equal('http')
    expect(spec[1]).to.exist()
    expect(spec[1].pin).to.equal('c:d')
    expect(spec[1].model).to.equal('observe')
    expect(spec[1].type).to.equal('http')
  })
})
