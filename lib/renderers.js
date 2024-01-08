const render = { // helpers.js, constants.js, markcord must be loaded, some renderers require app.js or/and bitwise.js
  Profile(user, profile) {
    const profileElement = helpers.createElement("div", {
      className: "profile"
    })
    const banner = helpers.getUserBanner(user, 1024)
    let bannerElement
    if (banner.startsWith("#")) {
      bannerElement = helpers.createElement("div", {
        className: "profile-banner single-color",
        style: `background-color: ${banner};`
      })
    } else {
      bannerElement = helpers.createElement("img", {
        className: "profile-banner",
        src: banner
      })
    }
    profileElement.append(bannerElement)

    profileElement.append(helpers.createElement("img", {
      className: "profile-avatar",
      src: helpers.getUserAvatar(user)
    }))

    const badges = helpers.injectBadges(user, profile.badges)
    const badgeList = helpers.createElement("div", { className: "profile-badge-wrapper" })
    badges.forEach(badge => badgeList.append(render.Badge(badge)))
    profileElement.append(badgeList)

    const userInfoWrapper = helpers.createElement("div", { className: "user-info-wrapper" })

    userInfoWrapper.append(helpers.createElement("h1", {
      className: "profile-name",
      textContent: helpers.getDisplayName(user)
    }))

    userInfoWrapper.append(helpers.createElement("h1", {
      className: "profile-username",
      textContent: helpers.getUsername(user)
    }))

    const pronouns = profile.user_profile.pronouns
    if (pronouns !== "") {
      userInfoWrapper.append(helpers.createElement("h1", {
        className: "profile-pronouns",
        textContent: helpers.getDisplayName(user)
      }))
    }

    userInfoWrapper.append(document.createElement("hr"))

    const bio = markcord.parse(profile.user_profile.bio)

    if (bio !== "") {
      userInfoWrapper.append(helpers.createElement("h2", {
        className: "profile-bio-header",
        textContent: "ABOUT ME"
      }))
      userInfoWrapper.append(helpers.createElement("p", {
        className: "profile-bio",
        innerHTML: bio
      }))
    }
    profileElement.append(userInfoWrapper)
    return profileElement
  },
  SpoilerAttachment(imageElement) {
    imageElement.className += " spoiler-attachment"
    imageElement.addEventListener("click", event => {
      console.log(event)
      if (imageElement.className.includes("spoiler-revealed"))
        return
      event.preventDefault();
      imageElement.className += " spoiler-revealed"
    })
  },
  ImageAttachment(attachment) {
    const imageElement = helpers.createElement("img", {
      className: "message-image-attachment",
      style: `aspect-ratio: ${attachment.width}/${attachment.height};`,
      src: attachment.proxy_url || attachment.url
    })
    if (attachment.filename && attachment.filename.startsWith("SPOILER_")) {
      render.SpoilerAttachment(imageElement)
    }
    return imageElement
  },
  VideoAttachment(attachment, controls = true, loop = false, autoplay = false, muted = false) {
    return helpers.createElement("video", {
      className: "message-video-attachment",
      width: attachment.width,
      height: attachment.height,
      controls: controls,
      loop: loop,
      autoplay: autoplay,
      muted: muted,
      src: attachment.proxy_url || attachment.url
    })
  },
  GenericAttachment(attachment) {
    const genericElement = helpers.createElement("div", { className: "message-attachment" })
    genericElement.append(helpers.createElement("p", {
      className: "message-attachment-name",
      textContent: attachment.filename
    }))
    genericElement.append(helpers.createElement("p", {
      className: "message-attachment-size",
      textContent: helpers.sizeParser(attachment.size)
    }))
    genericElement.append(helpers.createElement("a", {
      className: "message-attachment-download",
      textContent: "⬇️",
      href: attachment.proxy_url || attachment.url,
      rel: "noopener noreferrer",
      target: "_blank"
    }))
    return genericElement
  },
  MessageAttachment(attachment) {
    if (attachment.height && attachment.width) { // image-like attachment spotted
      if (attachment.content_type.startsWith("image/")) {
        return render.ImageAttachment(attachment)
      } else if (attachment.content_type.startsWith("video/")) {
        return render.VideoAttachment(attachment)
      }
    }
    return render.GenericAttachment(attachment)
  },
  MessageTimestamp(date, className) {
    const timestamp = helpers.getShortTimestamp(date)
    const longTimestamp = helpers.getLongTimestamp(date)
    if (timestamp) {
      return helpers.createElement("span", {
        className: className || "message-timestamp",
        textContent: timestamp,
        title: longTimestamp
      })
    } else {
      return helpers.createElement("span", {
        className: className || "message-timestamp",
        textContent: longTimestamp,
      })
    }
  },
  MessageAvatar(message, size, member, guild, alt, className) {
    return helpers.createElement("img", {
      className: className || "message-avatar",
      src: helpers.getUserAvatar(message.author, size, member, guild),
      alt: alt,
    })
  },
  MessageUsername(displayName, className) {
    return helpers.createElement("span", {
      className: className || "message-author",
      textContent: displayName
    })
  },
  MessageContent(content, render, parseFrom, className) {
    render = render || true
    const element = helpers.createElement("span", {
      className: className || "message-content"
    })
    if (render) {
      element.innerHTML = markcord.parse(content, parseFrom)
    } else {
      element.textContent = content
    }
    return element
  },
  SpecialEmbed(url, thumbnail) {
    const thumbnailWrap = helpers.createElement("div", { className: "special-embed-thumbnail-outer" })
    const thumbnailElement = render.ImageAttachment(thumbnail)
    thumbnailElement.className += " special-embed-thumbnail"
    thumbnailWrap.append(thumbnailElement)
    const embedIframe = helpers.createElement("iframe", {
      className: "special-embed-iframe",
      credentialless: true,
      referrerpolicy: "no-referrer",
      src: url
    })
    thumbnailWrap.addEventListener("click", () => thumbnailWrap.replaceWith(embedIframe))
    return thumbnailWrap
  },
  VideoEmbed(embed) {
    if (embed?.video?.url?.startsWith("https://www.youtube.com/embed/")) {
      return render.SpecialEmbed(`${constant.invidious}/embed/${embed.video.url.split("/").slice(-1)[0]}`, embed.thumbnail)
    } else if (embed?.video?.url?.startsWith("https://w.soundcloud.com/player/")) {
      return render.SpecialEmbed(embed.video.url.replace("&origin=twitter", "") + "&autoplay=1", embed.thumbnail)
    } else if (embed?.video?.url?.startsWith("https://twitter.com/i/videos/")) {
      const newVideo = {
        ...embed.video
      }
      newVideo.proxy_url = embed.url.replace("https://twitter.com", constant.fixtweet) + ".mp4"
      return render.VideoAttachment(newVideo)
    } else if (embed?.url?.startsWith("https://open.spotify.com/")) {
      return render.SpecialEmbed(embed.url.replace("/track/", "/embed/track/"), embed.thumbnail)
    } else if (embed?.video?.url?.startsWith("https://player.vimeo.com/video/")) {
      return render.SpecialEmbed(embed.video.url.split("?")[0] + "?autoplay=1&auto_play=1", embed.thumbnail)
    } else if (embed?.video?.url?.startsWith("https://player.twitch.tv/")) {
      return render.SpecialEmbed(embed.video.url.replace("&parent=meta.tag", "") + "&parent=" + location.hostname, embed.thumbnail)
    }
  },
  Embed(embed, content) {
    if (embed.type === constant.EmbedType.VIDEOGIF) {
      return [content.trim() === embed.url ? "" : content, render.VideoAttachment(embed.video, false, true, true, true)] // so gifs work well
    }
    if (embed.type === constant.EmbedType.IMAGE && embed.url === embed.thumbnail.url && !embed.title) {
      return [content.trim() === embed.url ? "" : content, render.ImageAttachment(embed.thumbnail)]
    }
    if (embed.type === constant.EmbedType.VIDEO && embed.url === embed.video.url && !embed.title) {
      return [content, render.VideoAttachment(embed.video)]
    }
    const embedElement = helpers.createElement("div", {
      className: "message-embed",
      style: `--embed-color: ${embed.color ? "#" + embed.color.toString(16) : "var(--primary)"};`
    })
    if (embed?.provider?.name) {
      const providerElement = helpers.createElement("p", {
        className: "message-embed-provider",
        textContent: embed.provider.name
      })
      if (embed.provider.url) {
        const providerURLElement = helpers.createElement("a", {
          className: "message-embed-provider-url",
          href: embed.provider.url,
          rel: "noopener noreferrer",
          target: "_blank"
        })
        providerURLElement.append(providerElement)
        embedElement.append(providerURLElement)
      } else {
        embedElement.append(providerElement)
      }
    }
    if (embed.author) {
      const authorElement = helpers.createElement("div", { className: "message-embed-author" })
      if (embed.author.proxy_icon_url || embed.author.icon_url) {
        authorElement.append(helpers.createElement("img", {
          className: "message-embed-author-icon",
          src: embed.author.proxy_icon_url || embed.author.icon_url,
          alt: embed.author.name
        }))
      }
      const authorNameElement = helpers.createElement("strong", {
        className: "message-embed-author-name",
        textContent: embed.author.name
      })
      if (embed.author.url) {
        const authorURLElement = helpers.createElement("a", {
          className: "message-embed-author-url",
          href: embed.author.url,
          rel: "noopener noreferrer",
          target: "_blank"
        })
        authorURLElement.append(authorNameElement)
        authorElement.append(authorURLElement)
      } else {
        authorElement.append(authorNameElement)
      }
      embedElement.append(authorElement)
    }
    if (embed.title) {
      const titleElement = helpers.createElement("h3", {
        className: "message-embed-title",
        innerHTML: markcord.parse(embed.title, "cutdown")
      })
      if (embed.url) {
        const linkElement = helpers.createElement("a", {
          className: "message-embed-url",
          href: embed.url,
          rel: "noopener noreferrer",
          target: "_blank"
        })
        linkElement.append(titleElement)
        embedElement.append(linkElement)
      } else {
        embedElement.append(titleElement)
      }
    }
    if (embed.description) {
      embedElement.append(helpers.createElement("p", {
        className: "message-embed-description",
        innerHTML: markcord.parse(embed.description)
      }))
    }
    if (embed.fields) {
      embed.fields.forEach(field => {
        const fieldElement = helpers.createElement("div", {
          className: field.inline ? "message-embed-inline-field" : "message-embed-field"
        })
        fieldElement.append(helpers.createElement("strong", {
          className: "message-embed-field-name",
          innerHTML: markcord.parse(field.name, "noHeadersAndUL")
        }))
        fieldElement.append(helpers.createElement("p", {
          className: "message-embed-field-value",
          innerHTML: markcord.parse(field.value, "noHeaders")
        }))
        embedElement.append(fieldElement)
      })
    }
    const specialEmbed = render.VideoEmbed(embed)
    if (specialEmbed) {
      embedElement.append(specialEmbed)
    } else {
      if (embed.thumbnail && !embed.image) {
        embedElement.append(render.ImageAttachment(embed.thumbnail))
      } else if (embed.thumbnail) {
        embedElement.append(helpers.createElement("img", {
          className: "message-embed-thumbnail",
          src: embed.thumbnail.proxy_url || embed.thumbnail.url,
          height: embed.thumbnail.height,
          width: embed.thumbnail.width
        }))
      } else if (embed.image) {
        embedElement.append(render.ImageAttachment(embed.image))
      }
      if (embed.video) {
        embedElement.append(render.VideoAttachment(embed.video))
      }
    }
    let timestamp
    if (embed.timestamp) {
      timestamp = new Date(embed.timestamp)
      timestamp = helpers.getShortTimestamp(timestamp) || helpers.getLongTimestamp(timestamp)
    }
    if (embed.footer) {
      const footerElement = helpers.createElement("div", { className: "message-embed-footer" })
      if (embed.footer.proxy_icon_url || embed.footer.icon_url) {
        footerElement.append(helpers.createElement("img", {
          className: "message-embed-footer-icon",
          src: embed.footer.proxy_icon_url || embed.footer.icon_url
        }))
      }
      let footerText = embed.footer.text || ""
      if (timestamp) {
        footerText += " • " + timestamp
      }
      footerElement.append(helpers.createElement("p", {
        className: "message-embed-footer-text",
        textContent: footerText
      }))
      embedElement.append(footerElement)
    } else if (timestamp) {
      const footerElement = helpers.createElement("div", {
        className: "message-embed-footer"
      })
      footerElement.append(helpers.createElement("p", {
        className: "message-embed-footer-text",
        textContent: timestamp
      }))
      embedElement.append(footerElement)
    }
    return [content, embedElement]
  },
  GenericMessage(message, memberAndGuild) {
    const [member, guild] = memberAndGuild || getMemberAndGuild(message)
    const element = helpers.createElement("div", {
      className: message.edited_timestamp ? "edited message" : "message",
      id: message.id
    })
    if (message.author.id == window.user.id) {
      element.className += " sent-by-user"
    }
    const displayName = helpers.getDisplayName(message.author, member)
    element.append(render.MessageAvatar(message, undefined, member, guild, displayName))
    const usernameElement = render.MessageUsername(displayName)
    usernameElement.append(render.MessageTimestamp(new Date(message.timestamp)))
    element.append(usernameElement)
    const appendToMessage = []
    let content = message.content
    message.attachments.forEach(attachment => appendToMessage.push(render.MessageAttachment(attachment)))
    message.embeds.forEach(embed => {
      embed = render.Embed(embed, content)
      if (!embed) return
      [newContent, embed] = embed
      if (typeof (newContent) === "string") {
        content = newContent
      }
      appendToMessage.push(embed)
    })
    const contentElement = render.MessageContent(content)
    appendToMessage.forEach(elem => contentElement.append(elem))
    element.append(contentElement)
    return element
  },
  BoostMessage(message, tier) {
    if (!tier)
      return render.NamelessMessage(message, `💠 ${helpers.getDisplayName(message.author)} just boosted the server${message.content ? " " + message.content + "times" : ""}!`)
    const guild = window.guilds[message.guild_id]
    return render.NamelessMessage(message, `💠 ${helpers.getDisplayName(message.author)} just boosted the server${message.content ? " " + message.content + "times" : ""}! ${guild.name} has achieved Level ${tier}!`)
  },
  Reply(reference, member, guild) {
    const reply = helpers.createElement("div", { className: "replied-message" })
    if (reference === null) {
      reply.append(helpers.createElement("i", {
        className: "replied-message-content",
        innerHTML: "Deleted message"
      }))
    } else if (reference === undefined) {
      reply.append(helpers.createElement("i", {
        className: "replied-message-content",
        innerHTML: "Unknown message"
      }))
    } else {
      const displayName = helpers.getDisplayName(reference.author, member)
      reply.append(render.MessageAvatar(reference, undefined, member, guild, displayName, "replied-message-avatar"))
      reply.append(render.MessageUsername(displayName, "replied-message-author"))
      reply.append(render.MessageContent(reference.content.replaceAll("\n", " "), true, "cutdown", "replied-message-content"))
      reply.className += " reply-" + reference.id
    }
    return reply
  },
  Message(message) {
    switch (message.type) {
      case constant.MessageType.recepientAdd:
        return render.NamelessMessage(message, `➕ ${helpers.getDisplayName(message.author)} added ${helpers.getDisplayName(message.mentions[0])}`)
      case constant.MessageType.recepientRemove:
        return render.NamelessMessage(message, `➖ ${helpers.getDisplayName(message.author)} removed ${helpers.getDisplayName(message.mentions[0])}`)
      case constant.MessageType.call:
        return render.NamelessMessage(message, `📞 ${helpers.getDisplayName(message.author)} started a call`)
      case constant.MessageType.channelNameChange:
        return render.NamelessMessage(message, `#️⃣ ${helpers.getDisplayName(message.author)} changed the name to ${content}`)
      case constant.MessageType.channelIconChange:
        return render.NamelessMessage(message, `#️⃣ ${helpers.getDisplayName(message.author)} changed the icon`)
      case constant.MessageType.pinnedMessage:
        return render.NamelessMessage(message, `📌 ${helpers.getDisplayName(message.author)} pinned a message`)
      case constant.MessageType.userJoin:
        return render.NamelessMessage(message, "➕ " + helpers.getJoinMessage(message).replace("{author}", helpers.getDisplayName(message.author)))
      case constant.MessageType.boost:
        return render.BoostMessage(message)
      case constant.MessageType.boostTier1:
        return render.BoostMessage(message, "1")
      case constant.MessageType.boostTier2:
        return render.BoostMessage(message, "2")
      case constant.MessageType.boostTier3:
        return render.BoostMessage(message, "3")
      case constant.MessageType.channelFollow:
        return render.NamelessMessage(message, `#️⃣ ${helpers.getDisplayName(message.author)} followed ${content} in this channel`)
      case constant.MessageType.discoveryDisqualified:
        return render.NamelessMessage(message, "This server has been removed from Server Discovery because it no longer passes all the requirements")
      case constant.MessageType.discoveryRequalified:
        return render.NamelessMessage(message, "This server is eligible for Server Discovery again and has been automatically relisted!")
      case constant.MessageType.discoveryGraceFirstWarning:
        return render.NamelessMessage(message, "This server has failed Discovery activity requirements for 1 week. If this server fails for 4 weeks in a row, it will be automatically removed from Discovery")
      case constant.MessageType.discoveryGraceFinalWarning:
        return render.NamelessMessage(message, "This server has failed Discovery activity requirements for 3 weeks in a row. If this server fails for 1 more week, it will be removed from Discovery")
      case constant.MessageType.threadCreated:
        return render.NamelessMessage(message, `#️⃣ ${helpers.getDisplayName(message.author)} has started a thread: ${message.content}`)
      case constant.MessageType.reply:
        const renderedMessage = render.GenericMessage(message, getMemberAndGuild(message))
        if (message.referenced_message) {
          const [member, guild] = getMemberAndGuild(message.referenced_message)
          renderedMessage.prepend(render.Reply(message.referenced_message, member, guild))
        } else {
          renderedMessage.prepend(render.Reply(message.referenced_message))
        }
        return renderedMessage
      default:
        return render.GenericMessage(message)
    }
  },
  NamelessMessage(message, overrideContent) {
    const element = helpers.createElement("div", {
      className: message.edited_timestamp ? "edited message nameless-message" : "message nameless-message",
      id: message.id
    })
    if (message.author.id == window.user.id) {
      element.className += " sent-by-user"
    }
    element.append(render.MessageContent(overrideContent || message.content, false))
    element.append(render.MessageTimestamp(new Date(message.timestamp)))
    return element
  },
  __ChannelItem(channel, className, guild, callback, permissions) {
    const wrap = helpers.createElement("div", { className: className })
    wrap.setAttribute("isWritable", bitwise.has(permissions, bitwise.Permissions.sendMessages))
    wrap.append(helpers.createElement("span", {
      className: "channel-name",
      textContent: channel.name
    }))
    wrap.addEventListener("click", event => {
      callback(event, channel, guild, wrap)
      document.title = `• Cablecord | #${channel.name} | ${guild.name}`
    })
    return wrap
  },
  _ChannelItem(channel, guild, callback, permissions) {
    if (channel.id === guild.rules_channel_id) {
      return render.__ChannelItem(channel, "rules channel", guild, callback, permissions)
    }
    switch (channel.type) {
      case constant.ChannelType.guildVoice:
        return render.__ChannelItem(channel, "voice channel", guild, callback, permissions)
      case constant.ChannelType.guildStageVoice:
        return render.__ChannelItem(channel, "stage channel", guild, callback, permissions)
      case constant.ChannelType.guildNews:
        return render.__ChannelItem(channel, "news channel", guild, callback, permissions)
      case constant.ChannelType.guildForum:
        return render.__ChannelItem(channel, "forum channel", guild, callback, permissions)
      case constant.ChannelType.guildMedia:
        return render.__ChannelItem(channel, "forum channel", guild, callback, permissions)
      case constant.ChannelType.guildCategory:
        const category = helpers.createElement("details", {
          className: "category",
          open: true
        })
        category.append(helpers.createElement("summary", { textContent: channel.name }))
        return category
      default:
        return render.__ChannelItem(channel, "channel", guild, callback, permissions)
    }
  },
  ChannelItem(basePermissions, member, parentChannel, guild, callback, appendTo) {
    const permissions = bitwise.computeOverwrites(basePermissions, member, parentChannel, guild)
    if (bitwise.has(permissions, bitwise.Permissions.viewChannel)) {
      const rendered = render._ChannelItem(parentChannel, guild, callback, permissions)
      if (parentChannel._children) {
        parentChannel._children.forEach(channel => render.ChannelItem(basePermissions, member, channel, guild, callback, rendered))
      }
      appendTo.append(rendered)
    }
  },
  GuildTitle(guild) {
    const banner = helpers.getGuildBanner(guild, 1024)
    const wrapper = helpers.createElement("div", { className: "server-title" })

    if (guild.premium_subscription_count > 0) {
      const badge = helpers.createElement("div", {
        className: "server-badge",
        textContent: "💠",
        title: `${guild.premium_subscription_count} boosts`
      })
      badge.append(helpers.createElement("span", {
        className: "server-badge-overlay",
        textContent: guild.premium_tier
      }))
      wrapper.append(badge)
    }
    wrapper.append(helpers.createElement("span", {
      className: "server-name",
      textContent: guild.name
    }))
    if (banner) {
      wrapper.className += " has-banner"
      wrapper.style = `--banner: url(${banner})`
    }

    return wrapper
  },
  WelcomeField(text) {
    return helpers.createElement("h2", {
      className: "welcome-text",
      textContent: text
    })
  },
  GuildInfo(guild) {
    window.chatMessages.innerHTML = ""
    window.messageInput.style.display = "none"

    const wrapper = helpers.createElement("div", { className: "welcome-wrapper" })

    const guildIcon = helpers.getGuildIcon(guild)
    if (typeof(guildIcon) !== "object") {
      wrapper.append(helpers.createElement("img", {
        className: "welcome-icon",
        src: guildIcon,
      }))
    }
    
    wrapper.append(helpers.createElement("h1", {
      id: "welcome",
      className: "welcome-text",
      textContent: guild.name
    }))

    helpers.appendIf(guild.description, render.WelcomeField(guild.description), wrapper)

    wrapper.append(render.WelcomeField(`ID: ${guild.id}`))

    if (guild.member_count > guild.max_members * 90 / 100) { // 90% of max member count
      wrapper.append(render.WelcomeField(`${guild.member_count}/${guild.max_members} members`))
    } else {
      wrapper.append(render.WelcomeField(`${guild.member_count} members`))
    }

    helpers.appendIf(guild?.channels?.length,
      render.WelcomeField(`${guild.channels.length} channels`), wrapper)

    helpers.appendIf(guild?.roles?.length, render.WelcomeField(`${guild.roles.length} roles`), wrapper)

    helpers.appendIf(guild?.emojis?.length, 
                     render.WelcomeField(`${guild.emojis.length} emojis`), wrapper)

    helpers.appendIf(guild?.stickers?.length,
      render.WelcomeField(`${guild.stickers.length} stickers`), wrapper)

    window.chatMessages.append(wrapper)
  },
  Guild(guild) {
    const channels = helpers.parseChannels(guild)
    window.channelBar.innerHTML = ""
    window.channelBar.append(render.GuildTitle(guild))
    const member = guild.members.find(member => member.user.id === window.user.id)
    const basePermissions = bitwise.computeBasePermissions(member, guild)
    channels.forEach(channel => render.ChannelItem(basePermissions, member, channel, guild, openChannel, window.channelBar))
    render.GuildInfo(guild)
    console.log(guild)
  },
  GuildIcon(guild, callback) {
    const serverElement = helpers.createElement("div", {
      className: "server",
      title: guild.name
    })

    const guildIcon = helpers.getGuildIcon(guild)
    if (typeof (guildIcon) === "object")
      serverElement.append(helpers.createElement("div", {
        className: "server-icon",
        textContent: guildIcon.join("")
      }))
    else
      serverElement.append(helpers.createElement("img", {
        className: "server-icon",
        src: guildIcon
      }))
    serverElement.addEventListener("click", callback(guild, serverElement))
    return serverElement
  },
  Badge(badge) {
    const icon = badge.icon.startsWith("/") ? badge.icon : `${constant.cdn}/badge-icons/${badge.icon}.png`
    const badgeElement = helpers.createElement("span", { className: "profile-badge" })
    if (badge.description)
      badgeElement.style.setProperty("--tooltip-content", '"' + badge.description + '"')
    const imageElement = helpers.createElement("img", { src: icon })
    if (badge.link) {
      const linkElement = helpers.createElement("a", {
        "href": badge.link,
        "target": "_blank",
        "rel": "noopener noreferrer"
      })
      linkElement.append(imageElement)
      badgeElement.append(linkElement)
      return badgeElement
    } else {
      badgeElement.append(imageElement)
      return badgeElement
    }
  }
}