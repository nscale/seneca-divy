const _ = require('lodash')

// TODO: pin needs to be object.. use jasonic if string

const createDefaultPin = pin => ({ pin, model: 'consume', type: 'http' })

module.exports = (listeners = []) => {
  const table = []

  listeners.forEach(o => {
    const { pin, pins, ...conf } = o
    const pushPin = p => table.push(_.extend(createDefaultPin(p), conf))

    if (pin) pushPin(pin)
    if (pins) pins.forEach(pushPin)
  })

  return table
}
