window.users = {}
window.guilds = {}
window.privateChannels = {}
window.user = {}
window.currentGuild = []
window.currentChannel = []
window.messageQueue = {}
window.opneningChannel = false
let wss = localStorage.getItem("gateway")
function htmlDecode(content) {
  const elem = document.createElement("span")
  elem.innerHTML = content
  return elem.textContent
}
window.onload = () => {
  window.serverBar = document.getElementById("server-bar")
  window.channelBar = document.getElementById("channel-bar")
  window.chatMessages = document.getElementById("chat-window-inner")
  window.main = document.getElementsByTagName("main")[0]
  window.messageInput = document.getElementById("message-input")
  document.addEventListener("visibilitychange", () => {
    if (window.chatMessages) {
      scrollIfNear(window.chatMessages, 500)
    }
  })
  markcord.types.cutdown = [
    markcord.regexRules.pre,
    markcord.regexRules.underline,
    markcord.regexRules.strikethrough,
    markcord.regexRules.bolditalic,
    markcord.regexRules.bold,
    markcord.regexRules.italic,
    markcord.regexRules.spoiler
  ]
  markcord.types.noHeaders = [
    markcord.regexRules.codeblock,
    markcord.regexRules.pre,
    markcord.regexRules.unorderedList,
    markcord.regexRules.quote,
    ...markcord.types.generic
  ]
  markcord.types.noHeadersAndUL = [
    markcord.regexRules.codeblock,
    markcord.regexRules.pre,
    markcord.regexRules.quote,
    ...markcord.types.generic
  ]
  markcord.renderers.cutdown = markcord.renderers.text
  markcord.renderers.noHeaders = markcord.renderers.text
  markcord.renderers.noHeadersAndUL = markcord.renderers.text
  markcord.renderers.codeblock = node => node[2].includes("codeblock") ? `\`\`\`${node[0]}\`\`\`` 
    : `<pre class="markcord-pre"><code class="markcord-code hljs">${tryHighlight(htmlDecode(node[0]), node[3]).value}</code></pre>` // hacky way but idc
}
async function withdrawConsent() {
  if (localStorage.getItem("checkConsent") === "false") return
  const consents = await (await window.rest.get("/users/@me/consent")).json()
  const newConsents = {
    grant: [],
    revoke: []
  }
  Object.keys(consents).forEach(name => {
    if (consents[name].consented)
      newConsents.revoke.push(name)
  })
  if (newConsents.revoke.length > 0)
    window.rest.post("/users/@me/consent", {body: newConsents})
}

function openGuildCallback(guild, guildIconElement) {
  return () => {
    if (window.currentGuild.length === 2) {
      window.currentGuild[1].className = "server"
    }
    resetCurrentChannel()
    window.currentGuild = [guild, guildIconElement]
    render.Guild(guild)
    guildIconElement.className = "selected server"
    document.title = `• Cablecord | ${guild.name}`
  }
}

function findGuildByChannelID(id) {
  return Object.values(window.guilds).find(guild => guild.channels.find(channel => channel.id === id))
}

function getMemberAndGuild(message) {
  let member
  let guild
  if (message.member) {
    member = message.member
  } else {
    guild = findGuildByChannelID(message.channel_id)
    member = guild.members.find(item => item.user.id === message.author.id)
  }
  return [member, guild]
}

function scrollIfNear(element, what = 250) {
  if (element.scrollHeight - element.scrollTop <= element.clientHeight + what) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  }
}

function onNewMessage(_, value) {
  const isAtBottom = helpers.isScrolledToBottom(window.chatMessages)

  console.log(isAtBottom, value)
  if (window.currentChannel[0].id === value.channel_id) {
    window.chatMessages.appendChild(render.Message(value))
    if (isAtBottom) {
      window.chatMessages.scrollTo({
        top: window.chatMessages.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      scrollIfNear(window.chatMessages)
    }
  }
}

function requestGuildMembers(ids, guild, query, limit) {
  const message = {
    guild_id: guild.id,
    user_ids: () => ids
  }
  if (query) {
    message.query = query
    message.limit = limit
  }
  window.gateway.send(window.gateway.messages.REQUEST_GUILD_MEMBERS, { d: message })
}

function updateMember(member, guild) {
  const foundMember = window.guilds[guild.id].members.find(item => item.user.id === member.user.id)
  if (!foundMember) {
    window.guilds[guild.id].members.push(member)
    return
  }
  const memberIndex = window.guilds[guild.id].members.indexOf(foundMember)
  window.guilds[guild.id].members[memberIndex] = Object.assign(foundMember, member)
}

function memberRequester(guild, pushTo) {
  const resultingFunc = message => {
    if (!message.member && (guild.members.find(member => message.author.id === member.user.id) === undefined)) {
      if (!pushTo.includes(message.author.id))
        pushTo.push(message.author.id)
    } else if (message.member) {
      updateMember(message.member, guild)
    }

    if (message.referenced_message) {
      resultingFunc(message.referenced_message)
    }
  }
  return resultingFunc
}

async function sendMessage(channel, content) {
  content = content.trim()
  if (content.length === 0) return
  const result = await window.rest.post(`/channels/${channel.id}/messages`, {
    body: {
      content: content
    }
  })
  console.log(await result.json())
}

function resetCurrentChannel() {
  if (window.currentChannel.length === 2 && !window.openingChannel) {
    window.messageQueue[window.currentChannel[0].id].onUpdate = null
    window.currentChannel[1].className = window.currentChannel[1].className.replace(" selected", "")
    window.currentChannel = []
  }
}

function getMissingMembers(guild, channel) {
  const getThem = []
  window.messageQueue[channel.id].forEach(memberRequester(guild, getThem))
  if (getThem.length !== 0) {
    requestGuildMembers(getThem, guild)
  }
}

async function getMessages(channel, guild) {
  if (window.messageQueue[channel.id]) {
    window.messageQueue[channel.id].onUpdate = onNewMessage
    return window.messageQueue[channel.id]
  }
  const messages = await window.rest.get(`/channels/${channel.id}/messages?limit=50`)
  if (messages.status !== 200) {
    return messages
  }
  window.messageQueue[channel.id] = HookArray(await messages.json())
  setTimeout(getMissingMembers, undefined, guild, channel)
  window.messageQueue[channel.id].onUpdate = onNewMessage
  return window.messageQueue[channel.id]
}

function lockMessageInput() {
  window.messageInput.value = "You are not allowed to send messages in this channel :("
  window.messageInput.disabled = true
}

function unlockMessageInput() {
  window.messageInput.value = ""
  window.messageInput.disabled = false
}

function tryHighlight(code, lang) {
  if (hljs.getLanguage(lang)) {
    return hljs.highlight(code, {language: lang})
  } else {
    return hljs.highlightAuto(code)
  }
}

function toggleMessageInput(item) {
  window.messageInput.style.display = "block"
  if (item.getAttribute("isWritable") === "true") {
    unlockMessageInput()
    window.messageInput.focus()
  } else {
    lockMessageInput()
  }
}

async function openChannel(event, channel, guild, item) {
  if (window.openingChannel) return
  resetCurrentChannel()
  window.openingChannel = true
  window.chatMessages.innerHTML = ""
  window.currentChannel = [channel, item]
  if (!item.className.includes("selected"))
    item.className += " selected"

  if (constant.ChannelType.TEXT.includes(channel.type)) {
    setTimeout(toggleMessageInput, undefined, item)
    const messages = await getMessages(channel, guild)
    if (messages.toString() === "[object Response]") {
      alert("failed to open channel; check console")
      console.log(messages)
      return
    }
    messages.forEach(message => window.chatMessages.prepend(render.Message(message)))
    window.chatMessages.scrollTo({
      top: window.chatMessages.scrollHeight,
      left: 0,
      behavior: "smooth"
    })
    window.main.scrollBy({ left: window.innerWidth, behavior: 'smooth' })
  }
  window.openingChannel = false
}

window.rest = RestAPI(constant.api, 9, window.token);
(async () => {
  if (typeof (wss) === "string") {
    Gateway(wss, 9, window.token)
  } else {
    wss = await (await window.rest.get("/gateway")).json()
    wss = wss.url
    Gateway(wss, 9, window.token)
    localStorage.setItem("gateway", wss)
  }
  withdrawConsent().catch(console.log)
  window.gateway.handleEvent("READY", data => {
    data = data.d
    window.user = data.user
    window.serverBar.innerHTML = ""
    data.guilds.forEach(guild => {
      window.guilds[guild.id] = guild
      window.serverBar.appendChild(render.GuildIcon(guild, openGuildCallback))
    })
    data.private_channels.forEach(privateChannel => {
      window.privateChannels[privateChannel.recipients[0].id] = privateChannel
    })
  })
  window.gateway.handleEvent("MESSAGE_CREATE", data => {
    data = data.d
    if (window.messageQueue[data.channel_id]) {
      window.messageQueue[data.channel_id].unshift(data)
    }
  })
  window.gateway.handleEvent("MESSAGE_UPDATE", data => {
    data = data.d
    if (window.messageQueue[data.channel_id]) {
      window.messageQueue[data.channel_id].every(message => {
        if (message.id != data.id) {
          return true
        }
        const index = window.messageQueue[data.channel_id].indexOf(message)
        window.messageQueue[data.channel_id][index] = Object.assign(message, data)
        const elem = document.getElementById(message.id)
        if (elem) {
          elem.replaceWith(render.Message(message))
          scrollIfNear(window.chatMessages)
        }
        const replies = document.getElementsByClassName("reply-" + message.id)
        if (replies.length > 0) {
          const [member, guild] = getMemberAndGuild(message)
          const renderedReply = render.Reply(message, member, guild)
          for (const reply of replies)
            reply.replaceWith(renderedReply)
        }
        return false
      })
    }
  })
  window.gateway.handleEvent("MESSAGE_DELETE", data => {
    data = data.d
    if (window.messageQueue[data.channel_id]) {
      window.messageQueue[data.channel_id].every(message => {
        if (message.id != data.id) {
          return true
        }
        const index = window.messageQueue[data.channel_id].indexOf(message)
        window.messageQueue[data.channel_id].splice(index, 1)
        const elem = document.getElementById(message.id)
        elem?.remove()
        const replies = document.getElementsByClassName("reply-" + message.id)
        if (replies.length > 0) {
          const renderedReply = render.Reply(null)
          for (const reply of replies)
            reply.replaceWith(renderedReply)
        }
        return false
      })
      window.messageQueue[data.channel_id].forEach(message => {
        if (message.referenced_message && message.referenced_message.id != data.id) {
          return
        }

        message.referenced_message = null
      })
    }
  })
  window.gateway.handleEvent("GUILD_MEMBERS_CHUNK", data => {
    data = data.d
    data.members.forEach(member => updateMember(member, { id: data.guild_id }))
  })
  window.gateway.start()
})()

const keyMap = { "Shift": false, "Enter": false };
onkeydown = onkeyup = e => {
  keyMap[e.key] = e.type == 'keydown'
  if (keyMap.Enter === true && keyMap.Shift === false &&
    window.currentChannel.length == 2 && !window.openingChannel) {
    e.preventDefault()
    sendMessage(window.currentChannel[0], window.messageInput.value)
    window.messageInput.value = ""
    window.messageInput.focus()
  }
}