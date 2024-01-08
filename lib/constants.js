const constant = {
  developers: [ // add yourself here if you are contributing :)
    "919181792219639808", "1143914223013994617", // laptop
    "752143718118850620"                         // jonas
  ],
  welcomeBack: [
    "Welcome back!",
    "We've missed you",
    "Welcome to Cablecord",
    "You're here! Let's go",
    "Ready to connect?",
    "Prepare for launch...",
    "Great to see you!",
    "Get ready to dive in!",
    "Good morning!",
    "Hey there!",
    "Ready to go!"
  ],
  cdn: "https://cdn.discordapp.com",
  api: "https://discord.com",
  invidious: "https://invidious.io.lol", // instance of github.com/iv-org/invidious
  fixtweet: "https://fxtwitter.com",     // instance of github.com/FixTweet/FixTweet
  Activity: {
    playing: 0,
    streaming: 1,
    listening: 2,
    watching: 3,
    custom: 4,
    competing: 5
  },
  bannerColors: [
    "#5865f2",
    "#757e8a",
    "#3ba55c",
    "#faa61a",
    "#ed4245",
    "#eb459f"
  ],
  ChannelType: {
    guildText: 0,
    DM: 1,
    guildVoice: 2,
    groupDM: 3,
    guildCategory: 4,
    guildNews: 5,
    // channeltypes from 5 to 10 are deprecated
    newsThread: 10,
    publicThread: 11,
    privateThread: 12,
    guildStageVoice: 13,
    guildDirectory: 14,
    guildForum: 15,
    guildMedia: 16,
    TEXT: [0, 1, 3, 5, 10, 11, 12],
    SUPPORTED: [0, 1, 4, 5],
    VOICE: [2, 13],
    FORUMLIKE: [15, 16]
  },
  PermissionOverwrite: {
    role: 0,
    member: 1
  },
  MessageType: {
    default: 0,
    recepientAdd: 1,
    recepientRemove: 2,
    call: 3,
    channelNameChange: 4,
    channelIconChange: 5,
    pinnedMessage: 6,
    userJoin: 7,
    boost: 8,
    boostTier1: 9,
    boostTier2: 10,
    boostTier3: 11,
    channelFollow: 12,
    // messagetype 13 is deprecated
    discoveryDisqualified: 14,
    discoveryRequalified: 15,
    discoveryGraceFirstWarning: 16,
    discoveryGraceFinalWarning: 17,
    threadCreated: 18,
    reply: 19,
    slashCommand: 20,
    threadStarter: 21,
    guildInviteReminder: 22,
    contextMenu: 23,
    autoMod: 24,
    roleSubscription: 25,
    upsell: 26,
    stageStart: 27,
    stageEnd: 28,
    stageSpeaker: 29,
    stageRaiseHand: 30,
    stageTopic: 31,
    applicationPremium: 32,
    privateChannelIntegrationAdded: 33,
    privateChannelIntegrationRemoved: 34,
    premiumReferral: 35,
    lockdownEnabled: 36,
    lockdownDisabled: 37,
    raidReported: 38,
    falseAlarmReported: 39
  },
  shortTime: ["en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }],
  longTime: ["en-GB"],
  EmbedType: {
    RICH: "rich",
    IMAGE: "image",
    VIDEO: "video",
    VIDEOGIF: "gifv",
    ARTICLE: "article",
    LINK: "link",
    AUTOMOD: "auto_moderation_message"
  },
  joinMessages: [
    "{author} joined the party.",
    "{author} is here.",
    "Welcome, {author}. We hope you brought pizza.",
    "A wild {author} appeared.",
    "{author} just landed.",
    "{author} just slid into the server.",
    "{author} just showed up!",
    "Welcome {author}. Say hi!",
    "{author} hopped into the server.",
    "Everyone welcome {author}!",
    "Glad you're here, {author}.",
    "Good to see you, {author}.",
    "Yay you made it, {author}!"
  ]
}


/* not in use currently
const UserFlags = {
  staff: 1,
  partner: 2,
  hypesquad: 4,
  bug_hunter_1: 8,
  mfa_sms: 16,
  premium_promo_dismissed: 32,
  bravery: 64,
  brilliance: 128,
  balance: 256,
  early_supporter: 512,
  team: 1024,
  internal_application: 2048,
  system: 4096,
  urgent_unread: 8192,
  bug_hunter_2: 16384,
  underage_deleted: 32768,
  verified_bot: 65536,
  verified_developer: 131072,
  moderator_alumni: 262144,
  bot_http_interactions: 524288,
  spammer: 1048576,
  disable_premium: 2097152,
  active_developer: 4194304,
  quarantined: 17592186044416 
}

const PurchaseFlags = {
  nitro_classic: 1,
  nitro: 2,
  guild_boost: 4,
  nitro_basic: 8
}

const PremiumUsageFlags = {
  premium_discriminator: 1,
  animated_avatar: 2,
  profile_banner: 4
}
*/