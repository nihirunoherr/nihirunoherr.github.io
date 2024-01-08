const bitwise = { // constants.js must be loaded
  Permissions: {
    invite: 1n,
    kick: 2n,
    ban: 4n,
    administrator: 8n,
    manageChannels: 16n,
    manageGuild: 32n,
    addReactions: 64n,
    auditLog: 128n,
    prioritySpeaker: 256n,
    stream: 512n,
    viewChannel: 1024n,
    sendMessages: 2048n,
    sendTTS: 4096n,
    manageMessages: 8192n,
    embedLinks: 16384n,
    attachFiles: 32768n,
    readMessageHistory: 65536n,
    mentionEveryone: 131072n,
    useExternalEmojis: 262144n,
    guildInsights: 524288n,
    connect: 1048576n,
    speak: 2097152n,
    muteMembers: 4194304n,
    deafenMembers: 8388608n,
    moveMembers: 16777216n,
    useVAD: 33554432n,
    changeOwnNickname: 67108864n,
    manageNicknames: 134217728n,
    manageRoles: 268435456n,
    manageWebhooks: 536870912n,
    manageExpressions: 1073741824n,
    useAppCommands: 2147483648n,
    requestToSpeak: 4294967296n,
    manageEvents: 8589934592n,
    manageThreads: 17179869184n,
    createPublicThreads: 34359738368n,
    createPrivateThreads: 68719476736n,
    useExternalStickers: 137438953472n,
    sendMessagesInThreads: 274877906944n,
    useEmbeddedActivities: 549755813888n,
    moderateMembers: 1099511627776n,
    viewMonetizationAnalytics: 2199023255552n,
    useSoundboard: 4398046511104n,
    createGuildExpressions: 8796093022208n,
    createEvents: 17592186044416n,
    useExternalSounds: 35184372088832n,
    sendVoiceMessages: 70368744177664n,
    useClyde: 140737488355328n,
    all: 281474976710655n, // all known
    none: 0n,
    default: 128611826256449n,
  },
  MessageFlags: {
    crossposted: 1n,
    crosspost: 2n,
    suppressEmbeds: 4n,
    crosspostSourceDeleted: 8n,
    urgent: 16n,
    hasThread: 32n,
    ephemeral: 64n,
    loading: 128n,
    roleMentionFailed: 256n,
    notDiscordLink: 1024n,
    silent: 4096n,
    voice: 8192n
  },
  has: (what, value) => (BigInt(what) & BigInt(value)) === BigInt(value),
  computeBasePermissions: (member, guild) => { // i stole the code but translated it to js
    if (guild.owner_id === member.user.id) {
      return bitwise.Permissions.all
    }

    let permissions = BigInt(guild.roles.find(role => role.id === guild.id).permissions)

    member.roles.forEach(role => {
      permissions |= BigInt(role.permissions ?? guild.roles.find(foundRole => foundRole.id === role).permissions)
    })

    if (bitwise.has(permissions, bitwise.Permissions.administrator)) {
      return bitwise.Permissions.all
    }
    return permissions
  },
  computeOverwrites: (basePermissions, member, channel, guild) => { // i stole it from
    let permissions = BigInt(basePermissions)
    if (bitwise.has(basePermissions, bitwise.Permissions.administrator)) {
      return bitwise.Permissions.all
    }
    
    const everyoneOverwrites = channel.permission_overwrites.find(overwrite => overwrite.type === constant.PermissionOverwrite.role && overwrite.id === guild.id)

    if (everyoneOverwrites) {
      permissions &= ~BigInt(everyoneOverwrites.deny)   
      permissions |= BigInt(everyoneOverwrites.allow)
    }

    let allow = bitwise.Permissions.none
    let deny = bitwise.Permissions.none

    member.roles.forEach(role => {
      const overwrite = channel.permission_overwrites.find(overwrite => overwrite.type === constant.PermissionOverwrite.role && overwrite.id === (role.id || role))
      if (overwrite) {
        allow |= BigInt(overwrite.allow)
        deny |= BigInt(overwrite.deny)
      }
    })

    permissions &= ~deny
    permissions |= allow

    const memberOverwrite = channel.permission_overwrites.find(overwrite => overwrite.type === constant.PermissionOverwrite.member && overwrite.id === (member.user.id))
    if (memberOverwrite) {
      permissions &= ~BigInt(memberOverwrite.deny)   
      permissions |= BigInt(memberOverwrite.allow)
    }

    if (member.communication_disabled_until && new Date(member.communication_disabled_until) - new Date > 0) {
      let newPermissions = bitwise.Permissions.none
      if (bitwise.has(permissions, bitwise.Permissions.viewChannel)) {
        newPermissions |= bitwise.Permissions.viewChannel
      }

      if (bitwise.has(permissions, bitwise.Permissions.readMessageHistory)) {
        newPermissions |= bitwise.Permissions.readMessageHistory
      }

      return newPermissions
    }
    return permissions
  },
  computePermissions: (member, guild, channel) => { // discord docs
    return bitwise.computeOverwrites(bitwise.computeBasePermissions(member, guild), member, channel, guild)
  } 
}