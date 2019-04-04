# Seneca Divy

    A transport to work with the divy service mesh

This is the easiest way to connect your seneca service to a divy proxy. Check out [nscale](https://www.npmjs.com/package/nscale), who uses divy to power its service mesh, to learn more about building nodejs microservices.

- **Sponsor**: [37teams](https://www.37teams.com)
- **Status**: experimental

## Installation

```bash
npm install seneca-divy
```

`seneca-divy` depends on `seneca-promisify` so be sure to add that
if you do not have it.

```bash
npm install seneca-promisify
```

## Usage (with usrv)

[todo]

## Usage (without usrv)

If you are not using [usrv](https://www.npmjs.com/package/usrv) as a service container then do the following:

First, you will need register `seneca-divy` as a plugin. Lets assume you have your service definition in `index.js`. The minimal config needed is telling divy what messages you want to send through the proxy. This is done by providing listen configuration.

```js
// index.js
const seneca = require('seneca')

seneca()
  .use('promisify')
  .use('divy', {
    listen: [{ pin: 'foo:bar' }]
  })
```

The above is telling divy that this service cares about any message that matches pattern `foo:bar`. Divy will then route any messages in the network that match to this service. To learn more about pattern base routing [here](#todo)

The listen config is the main place you can establish the network configuration for the action patterns the service cares about. Here is the full list of options for a listner config.

**Listen Options**

```js
{
  // Pins is an array of patterns to match against messages that flow over the
  // network. If there is a match, the message will be pushed to the service
  // that it matched against.
  //
  // required
  pins: ['foo:bar'],

  // Model determines if a message is going to be consumed by the service or
  // observed. Oberved is what you should select for async messages - ones
  // where no response is expected.
  //
  // optional; default: consume
  model: 'consume',

  // Divy is an all inclusive transport meaning no other app level network
  // transports are recommend. Type is used to select the filter you want
  // divy to use. Its worth noting that divy has a control pane that can
  // be manipulated outside of these so, for example, the network my have
  // NATS handle all messages have a model `observe`. In that case this type
  // will be ignored and therefore is optional.
  //
  // optional; default: http
  type: 'http'
}
```

**Plugin Options**
Here are the options you can provide specifically when initializing the plugin. If you see an option with `env:{an_env_variable_name}` (ie. `env: PORT`) that means that if there is an env var that matches that name the value will be used for the config option. The preference order is `config` -> `env` -> `defaults`.

```js
{
  // This is the port the service will attach to. Divy communicates
  // to the service through this port. This should be left as the
  // default. The primary use case for altering this is for local
  // development.
  //
  // Note:
  // This needs to stay in sync with divy settings.
  //
  // optional; defaults: 40000; env PORT
  port: 40000,

  // This is the host of your application. Its unlikely this will be
  // anything other then localhost. The default deployment pattern
  // for divy and an accompany service is a sidecar pattern in k8.
  // The divy proxy and this application therefore will share the
  // same host and can communicate on it.
  //
  // Note:
  // This needs to stay in sync with divy settings.
  //
  // optional; defaults: '127.0.0.1'; env: HOST
  host: '127.0.0.1',

  // The proxy port is the port the service uses to communicate
  // to the divy proxy. This should be left as the default. The
  // main use case for allowing this and the above port config
  // is for local development where you need to avoid port
  // collisions with multiple running proxies and service.
  //
  // Note:
  // This needs to stay in sync with divy settings.
  //
  // optional; defaults: 10000; env: PROXY_HTTP_PORT
  proxyPort: 10000,

  // The proxy host is the host the service uses to communicate
  // to the divy proxy. This should be left as the default and
  // only changed if you know why you need to change it.
  //
  // Note:
  // This needs to stay in sync with divy settings.
  //
  // optional; defaults: '127.0.0.1'; env: PROXY_HTTP_PORT
  proxyHost: '127.0.0.1',

  // The action patterns this service cares about. Divy
  // will send any matching messages to the service following
  // divy's pattern routing rules.
  //
  // required; refer to listen options
  listen: [{...listen_configurations}]
}
```

### Error Handling

[TODO]

### Changes imposed on seneca

For now, you cannot use any other transport within the application layer when using divy. We may address this at another time but for now we are operting on the assumption that all network traffic will flow through divy and any transport methods will be handled by divy through its filters.

### Thanks

**usrv** would not be possible without the valuable open-source work of projects in the community. We would like to extend a special thank-you to [Richard Rodger](http://www.richardrodger.com/) and [Seneca](https://github.com/senecajs/seneca).
