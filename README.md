# 🔨 Discord Bonk Bot

> A Discord bot for sending friends to horny jail with style and chaos

[![Discord.js](https://img.shields.io/badge/discord.js-v14.21.0-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/node.js-v18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.2.0-brightgreen.svg)](package.json)

## 🎯 What is Bonk Bot?

A Discord bot originally created for the chaotic **Muskulhige Hiya** server. Send your friends to **individual horny jail channels** where everyone can watch their shame unfold. Complete with an economy system, defensive power-ups, emergency management tools, and full configuration customization.

<div align="center">

![Bonk Demo](https://c.tenor.com/DuN47QciYfsAAAAC/tenor.gif)

</div>

---

## 🎮 Commands

### Core Bonking Commands
- `/bonk @user` - Send someone to horny jail (10 min)
- `/bonksoft @user` - Light bonking (5 min)  
- `/bonkmega @user` - MAXIMUM BONK (15 min)
- `/bonkhelp` - Complete command guide with examples

### Economy Commands
- `/bonkclaim` - Claim daily coins (8-20 coins with streak bonuses)
- `/bonkbalance` - Check your coin balance and statistics
- `/bonkgift @user amount` - Gift coins to friends (spread the wealth)
- `/bonkgamble amount` - Risk coins for rewards (configurable odds)

## ✨ Features

### 🔨 **Advanced Bonking System**
- **Individual Jail Channels** - Each bonked user gets their own public shame chamber
- **Progressive Jail Times** - Configurable escalating punishments (5/10/15 minutes)
- **Admin Protection** - Server owner and admins are immune to bonking
- **Auto-Recovery** - Bot automatically fixes broken permissions and releases stuck users on restart
- **Crash Protection** - Smart startup recovery prevents permanent jail situations
- **Jail Escape Mechanics** - Lock picking, jailbreak events, and good behavior rewards

### 💰 **Complete Economy System**
- **Daily Coin Claims** - Earn 8-20 coins daily with consecutive login streak bonuses
- **Coin Gifting** - Share wealth with friends (or bribe potential victims)
- **Advanced Gambling** - Risk it all for big rewards with configurable odds
- **Power-Up Shop** - 7 unique defensive and offensive items

### 🛡️ **Power-Up Arsenal**
| Power-Up | Price | Effect | Type |
|----------|-------|--------|------|
| 🛡️ **Bonk Shield** | 25 coins | Block the next bonk attempt | Defense |
| 🌟 **1-Hour Immunity** | 50 coins | Cannot be bonked for 1 hour | Defense |
| 💰 **Double Coin Boost** | 30 coins | Earn double coins from claims for 24h | Economy |
| 🗝️ **Parole Pass** | 40 coins | Next jail sentence reduced by 50% | Defense |
| ⚡ **Bonk Power Boost** | 35 coins | Next bonk jails target for double time | Offense |
| 🍀 **Lucky Charm** | 45 coins | Next gamble has +20% better odds | Economy |
| ↩️ **Bonk Reflect** | 55 coins | Next bonk attempt bounces back to attacker | Defense |

### 🎉 **Special Events System**
Administrators can activate server-wide events that change gameplay mechanics:

| Event | Effect | Duration | Description |
|-------|--------|----------|-------------|
| 🎊 **Double Credit Weekend** | 2x daily coin rewards | Configurable | Everyone gets **6 bonk credits** per day instead of 3! |
| 🎲 **Bonk Roulette** | 20% backfire chance | Configurable | Mega bonks have a **20% chance** to backfire and jail the bonker instead! |
| 🔄 **Reverse Bonk Day** | Free revenge bonks | Configurable | Victims can immediately bonk back for **FREE** within 1 minute! |

**Event Features:**
- **Flexible Duration**: Events can run from 1 hour to 1 week (168 hours)
- **Custom Multipliers**: Set credit multipliers from 0.1x to 10.0x
- **User Immunity**: Grant specific users immunity from bonking during events
- **Event Stacking**: Multiple event effects can be active simultaneously

### � **Jail Escape System**
Turn jail time into strategic gameplay with multiple escape routes:

| Escape Method | Cost | Success Rate | Description |
|---------------|------|--------------|-------------|
| 🔑 **Lock Picking** | 5-50 coins | 10-70% | Solo escape attempt - more coins = better odds |
| 🤝 **Jailbreak** | 10+ coins | 100% at 100 coins | Team effort - multiple users fund the escape |
| 📖 **Good Behavior** | Free | Automatic | Stay active in jail to earn sentence reductions |

**Escape Features:**
- **Lock Picking**: Pay coins for RNG-based escape attempts (5 coins = 10% chance, 50 coins = 70% chance)
- **Jailbreak Events**: Multiple users can contribute coins to break someone out (requires 100 total coins)
- **Good Behavior**: Earn 2 minutes off sentence for every 10 messages in jail (30-second cooldown between counted messages)
- **Strategic Gameplay**: Choose between solo risk vs. community cooperation

### �📊 **Statistics & Management**
- **Comprehensive Stats** - Track bonks given/received, jail time, streaks, coins earned
- **Leaderboards** - See who's the ultimate bonker or victim
- **Special Events** - Bonk Roulette can backfire spectacularly
- **Emergency Controls** - Admin panic command to release all jailed users instantly

### ⚙️ **Full Configuration System**
- **Modular Config File** - Customize every aspect without touching code
- **Configurable Messages** - Personalize jail messages and error responses
- **Adjustable Timers** - Set custom jail times and check intervals
- **Feature Toggles** - Enable/disable specific features as needed

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **Discord Bot Token** ([Create one here](https://discord.com/developers/applications))
- **Basic Discord permissions** (Manage Roles, Manage Channels, Send Messages)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HumbleCantaloupe/Bonk-bot.git
   cd Bonk-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your bot**
   ```json
   // config.json
   {
     "token": "YOUR_BOT_TOKEN",
     "clientId": "YOUR_BOT_CLIENT_ID",
     "guildId": "YOUR_GUILD_ID"
   }
   ```

4. **Customize bot settings (Optional)**
   ```json
   // bot-config.json - Fully customizable
   {
     "jailSettings": {
       "jailTimes": { "soft": 5, "regular": 10, "mega": 15 }
     },
     "economySettings": {
       "startingCoins": 10
     }
     // ... and much more!
   }
   ```

5. **Deploy commands**
   ```bash
   node deploy-commands.js
   ```

6. **Start the bot**
   ```bash
   node main.js
   ```

## 🎮 Commands

### Core Commands
- `/bonk @user` - Send someone to horny jail (10 min)
- `/bonksoft @user` - Light bonking (5 min)  
- `/bonkmega @user` - MAXIMUM BONK (15 min)
- `/bonkhelp` - Complete command guide

### Economy Commands
- `/bonkclaim` - Claim daily coins
- `/bonkbalance` - Check your coin balance
- `/bonkgift @user amount` - Gift coins to friends
- `/bonkgamble amount` - Risk coins for rewards

### Shop Commands
- `/bonkshop browse` - Browse available power-ups with prices
- `/bonkshop buy item` - Purchase power-ups with coins
- `/bonkshop inventory` - Check your items and active effects
- `/bonkshop use item` - Activate power-ups strategically

### Escape Commands
- `/bonkescape lockpick coins` - Pay coins to attempt lock picking escape
- `/bonkescape jailbreak @prisoner coins` - Contribute coins to help someone escape
- `/bonkescape behavior` - Check your good behavior status and sentence reduction

### Administrative Commands
- `/bonkstats` - View detailed personal statistics
- `/bonkadmin` - Admin management tools (admin only)
  - `release @user` - Release a user from horny jail early
  - `addcredits @user amount` - Add bonk credits to a user (1-10 coins)
  - `reset` - Reset all user data (use with caution!)
- `/bonkevents` - Special event controls (admin only)
  - `start event duration` - Start special events (Double Credit Weekend, Bonk Roulette, Reverse Bonk Day)
  - `stop` - Stop all active events
  - `status` - Check current event status
  - `immunity @user grant/remove` - Grant or remove bonk immunity
  - `multiplier value` - Set credit multiplier for events (0.1-10.0)
- `/bonkpanic` - 🚨 Emergency: Release all jailed users and restore permissions (admin only)
- `/bonkfix @user` - 🔧 Manually restore roles and fix stuck users (admin only)
- `/bonkdebug @user` - 🐛 Debug jail timestamps and fix stuck users (admin only)
- `/bonkdebuguser @user` - Debug a specific user's jail state (admin only)
- `/bonkroles @user` - 🔧 Check saved role data for users (admin only)
- `/bonktest` - 🔧 Test jail release system (admin only)

---

## 🔧 Configuration

### Required Discord Permissions
The bot needs these permissions to function properly:
- `Manage Roles` - Create and assign jail roles
- `Manage Channels` - Create individual jail channels
- `Send Messages` - Basic communication
- `Embed Links` - Rich message formatting
- `View Channels` - Access server channels
- `Use Slash Commands` - Modern command interface

### Bot Configuration File
The `bot-config.json` file provides extensive customization options:

```json
{
  "jailSettings": {
    "roleName": "Horny Jail",
    "roleColor": "#FF69B4",
    "jailTimes": { "soft": 5, "regular": 10, "mega": 15 }
  },
  "economySettings": {
    "startingCoins": 10,
    "dailyRewards": [8, 10, 12, 14, 16, 18, 20]
  },
  "moderationSettings": {
    "adminImmunity": true,
    "serverOwnerImmunity": true
  },
  "systemSettings": {
    "jailCheckInterval": 60000,
    "startupRecovery": true
  },
  "messages": {
    "jailMessages": ["has been bonked and sent to horny jail!"],
    "errorMessages": {
      "cannotBonkSelf": "🚫 You cannot bonk yourself!",
      "insufficientCoins": "🚫 You don't have enough bonk coins!"
    }
  }
}
```

### Environment Setup
For secure token storage, create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id
GUILD_ID=your_server_id
```

---

## 🛠️ Technical Details

### Built With
- **Discord.js v14** - Discord API wrapper
- **Node.js v18+** - Runtime environment
- **JSON** - Data persistence (lightweight and portable)

### File Structure
```
bonk-bot/
├── commands/utility/        # All slash commands
│   ├── bonk.js             # Standard bonk command
│   ├── bonksoft.js         # Light bonk command  
│   ├── bonkmega.js         # Heavy bonk command
│   ├── bonkshop.js         # Power-up shop system
│   ├── bonkpanic.js        # Emergency release command
│   └── ...                 # Other utility commands
├── main.js                 # Bot entry point & core logic
├── deploy-commands.js      # Command registration script
├── config.json             # Bot credentials
├── bot-config.json         # Feature configuration
├── data.json              # User data storage
├── package.json           # Dependencies
└── README.md              # Documentation
```

### Key Features Implementation
- **Automatic Jail Release**: Bot checks every 60 seconds for expired jail times
- **Complete Permission Restoration**: Original roles saved when jailed, fully restored on release or crash recovery
- **Crash Recovery**: Startup recovery system prevents permanent jail situations and restores all permissions
- **Individual Channels**: Each jailed user gets a personal jail channel
- **Power-Up System**: 7 different power-ups with defensive and offensive capabilities
- **Admin Protection**: Server owners and administrators cannot be bonked
- **Configurable Everything**: Jail times, messages, costs, and features are all customizable

### Data Management
- User data stored in `data.json` with automatic backups
- **Complete Permission Restoration**: Original user roles saved when jailed and fully restored upon release
- **Startup Recovery**: Fixes broken permissions after crashes and restores all original roles
- Individual jail channel cleanup on user release
- Persistent power-up effects across bot restarts

### Recovery 
- **Smart Permission Handling**: Original roles saved before jailing, restored after release or crash
- **Crash Protection**: Bot automatically releases stuck users and restores their permissions on restart
- **Auto-Cleanup**: Orphaned jail channels and broken permission states automatically fixed





<div align="center">

**Made with ❤️ and a lot of ☕ by [Marrow](https://github.com/HumbleCantaloupe)**

*Remember: Bonk responsibly! With great power comes great bonkability.* 🔨

</div>
