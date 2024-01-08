const Gateway = (base, version, token) => { // constants.js must be loaded
  const instance = {
    ws: null,
    base: base,
    version: version,
    token: token,
    seq: null,
    sessionID: null,
    resuming: false,
    presence: {
      activities: [],
      afk: false,
      since: 0,
      status: "online"
    },
    properties: { // how the client presents itself 
      os: "Linux",
      browser: "Firefox",
      device: "",
      system_locale: "en-US",
      browser_user_agent: "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
      browser_version: "",
      os_version: "",
      referrer: "",
      referring_domain: "",
      referrer_current: "",
      referring_domain_current: "",
      release_channel: "stable",
      client_build_number: 235476,
      client_event_source: null
    },
    start: () => {
      const self = window.gateway
      self.ws = new WebSocket(self.base + "/?encoding=json&v=" + self.version)
      self.ws.onmessage = e => {
        data = JSON.parse(e.data)
        console.log('<-', data)
        self.opcodeHandlers[data.op]?.forEach(handler => handler(data, self))
      }
      self.ws.onerror = self.ws.onclose = self.reconnect
    },
    reconnect: () => {
      const wait = Math.floor(Math.random() * 1.5) + Number(Math.random().toString().slice(0, 5))
      console.warn("Lost connection to gateway. Reconnecting in", wait)
      setTimeout(window.gateway._reconnect, wait * 1000)
    },
    _reconnect: () => {
      const self = window.gateway;
      clearInterval(self.heartbeat.intervalID)
      self.heartbeat = Object.assign(self.heartbeat, {
        interval: 0,
        acked: true,
        intervalID: 0
      })
      self.resuming = self.sessionID !== null
      self.start()
    },
    messages: {
      HEARTBEAT: {
        op: 1,
        d: self => self.seq
      },
      IDENTIFY: {
        op: 2,
        d: {
          capabilities: 0, // default discord value is 16381, 1 << (from 1 to 12) ORed
          properties: self => self.properties,
          client_state: {
            guild_versions: {},
            highest_last_message_id: "0",
            read_state_version: 0,
            user_guild_settings_version: -1,
            user_settings_version: -1,
            private_channels_version: "0",
            api_code_version: 0
          },
          compress: false,
          presence: self => self.presence,
          token: self => self.token
        }
      },
      RESUME: {
        op: 6,
        d: {
          token: self => self.token,
          session_id: self => self.sessionID,
          seq: self => self.seq
        }
      },
      REQUEST_GUILD_MEMBERS: {
        op: 8,
        d: {
          guild_id: 0,
          user_ids: []
        }
      }
    },
    heartbeat: {
      interval: 0,
      acked: true,
      intervalID: 0,
      send: () => {
        self = window.gateway
        if (!self.heartbeat.acked) {
          return self.reconnect()
        } else {
          self.heartbeat.acked = false;
          return self.send(self.messages.HEARTBEAT)
        }
      }
    },
    executor: message => {
      const self = window.gateway
      const newMessage = {
        ...message
      }
      Object.keys(newMessage).forEach(key => {
        switch (typeof (newMessage[key])) {
          case "function":
            newMessage[key] = newMessage[key](self)
            break
          case "object":
            if (newMessage[key] !== null) {
              newMessage[key] = self.executor(newMessage[key])
            }
            break
        }
      })
      return newMessage
    },
    send: (message, override = {}) => {
      const self = window.gateway
      message = self.executor(Object.assign(message, override))
      console.log('->', message)
      return self.ws.send(JSON.stringify(message))
    },
    opcodeHandlers: {
      10: [(data, self) => {
        data = data.d
        self.heartbeat.interval = data.heartbeat_interval
        if (self.resuming) {
          self.send(self.messages.RESUME)
        } else {
          self.send(self.messages.IDENTIFY)
        }
        self.heartbeat.send()
        self.heartbeat.intervalID = setInterval(self.heartbeat.interval, self.heartbeat.send)
      }],
      11: [(_, self) => {
        self.heartbeat.acked = true
      }],
      0: [(data, self) => {
        self.eventHandlers[data.t]?.forEach(handler => handler(data, self))
        self.seq = data.s
      }],
      1: [(_, self) => self.heartbeat.send()],
      7: [(data, self) => self.reconnect(data)],
      9: [(data, self) => {
        self.sessionID = data.d ? self.sessionID : null
        self.reconnect(data)
      }]
    },
    eventHandlers: {
      "READY": [(data, self) => {
        data = data.d
        self.sessionID = data.session_id
        self.base = data.resume_gateway_url
      }]
    },
    addHandler(to, which, handler) {
      to[which] ??= []
      to[which].push(handler)
    },
    handleOpcode(opcode, handler) {
      this.addHandler(this.opcodeHandlers, opcode, handler)
    },
    handleEvent(event, handler) {
      this.addHandler(this.eventHandlers, event, handler)
    }
  }
  window.gateway = instance
}