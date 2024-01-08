const helpers = { // constants.js must be loaded
  createElement(type, options={}) { 
    return Object.assign(document.createElement(type), options) // troll
  },
  appendIf(cond, elem, to) {
    to ??= window.chatMessages
    if (cond) {
      to.append(elem)
    }
  },
  isScrolledToBottom: element => Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 2,
  sizeParser(size) {
    if (size < 1024) {
      return `${size} bytes`
    } else if (size < 1048576) {
      return `${Math.ceil(size/1024)} KB`
    } else {
      return `${Math.ceil(size/1048576)} MB`
    }
  },
  getShortTimestamp(date) {
    if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
      return date.toLocaleTimeString( ...constant.shortTime )
    }
  },
  getLongTimestamp: date => date.toLocaleString( ...constant.longTime ),
  orderChannels: channels => channels.sort((channel1, channel2) => channel1.position - channel2.position),
  parseChannels(guild) {
    let uncategorized = guild.channels.filter(channel => !channel.parent_id && channel.type !== constant.ChannelType.guildCategory)
    uncategorized = helpers.orderChannels(
      uncategorized.filter(channel => !constant.ChannelType.VOICE.includes(channel.type))
    ).concat(
      helpers.orderChannels(
        uncategorized.filter(channel => constant.ChannelType.VOICE.includes(channel.type))
      )
    )
    const categorized = helpers.orderChannels(guild.channels.filter(channel => channel.type === constant.ChannelType.guildCategory))
    categorized.forEach(category => {
      let items = guild.channels.filter(channel => channel.parent_id === category.id)
      items = helpers.orderChannels(
        items.filter(channel => !constant.ChannelType.VOICE.includes(channel.type))
      ).concat(
        helpers.orderChannels(
          items.filter(channel => constant.ChannelType.VOICE.includes(channel.type))
        )
      )
      categorized[categorized.indexOf(category)]._children = items
    })
    return uncategorized.concat(categorized)
  },
  selectRandom: from => from[Math.floor(Math.random() * from.length)],
  getAssetExt: asset => asset.startsWith("a_") ? "gif" : "webp",
  getIndex(user) {
    if (user.discriminator === "0") {
      return Number((BigInt(user.id) >> 22n) % 6n)
    } else {
      return Number(user.discriminator) % 5
    }
  },
  getUserBanner(user, size) {
    if (user.banner) {
      const ext = helpers.getAssetExt(user.banner)
      return `${constant.cdn}/banners/${user.id}/${user.banner}.${ext}${size ? ("?size=" + size) : ""}`
    } else {
      return user.banner_color || constant.bannerColors[helpers.getIndex(user)]
    }
  },
  getUserAvatar(user, size, member, guild) {
    if (member && guild && member.avatar) {
      const ext = helpers.getAssetExt(member.avatar)
      return `${constant.cdn}/guilds/${guild.id}/users/${user.id}/avatars/${member.avatar}.${ext}${size ? ("?size=" + size) : ""}` 
    }
    const avatar = user.avatar
    if (avatar) {
      const ext = helpers.getAssetExt(avatar)
      return `${constant.cdn}/avatars/${user.id}/${avatar}.${ext}${size ? ("?size=" + size) : ""}`
    } else {
      return `${constant.cdn}/embed/avatars/${helpers.getIndex(user)}.png`
    }
  },
  getGuildIcon(guild, size) {
    if (guild.icon) {
      const ext = helpers.getAssetExt(guild.icon)
      return `${constant.cdn}/icons/${guild.id}/${guild.icon}.${ext}${size ? ("?size=" + size) : ""}`
    } else {
      return guild.name.split(/\s+/).map(string => string[0])
    }
  },
  getGuildBanner(guild, size) {
    if (guild.banner) {
      const ext = helpers.getAssetExt(guild.banner)
      return `${constant.cdn}/banners/${guild.id}/${guild.banner}.${ext}${size ? ("?size=" + size) : ""}`
    }
  },
  getJoinMessage: message => constant.joinMessages[new Date(message.timestamp) % 13],
  getUsername: user => user.discriminator === "0" ? user.username : `${user.username}#${user.discriminator}`,
  getDisplayName: (user, member={}) => member.nick || user.global_name || user.username,
  injectBadges(user, badges) { // rework later
    if (constant.developers.includes(user.id)) {
      return [{ id: "cablecordcontributor", description: "Cablecord Contributor", icon: "/media/loading.gif", link: "https://github.com/cordcutters" }, ...badges]
    }
    return badges
  }
}