# 🔨 Discord Bonk Bot

> **A Discord bot for sending Muskulhige Hiya folks to horny jail with style!**

[![Discord.js](https://img.shields.io/badge/discord.js-v14.21.0-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/node.js-v18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/AhmedViam/Bonk-bot?style=social)](https://github.com/AhmedViam/Bonk-bot/stargazers)

## 🎯 What is Bonk Bot?

A fun Discord bot created for the chaotic **Muskulhige Hiya** server (where apparently everyone needed more bonking). Send your horny friends to **individual horny jail channels** where everyone can watch their shame unfold. With a full economy system, power-ups, and enough customization to make every bonk memorable.

![Bonk Demo](https://c.tenor.com/x8v1oNUOmg4AAAAd/tenor.gif)

---

## ✨ Features

### 🔨 **Core Bonking System**
- **Individual Jail Channels** - Each bonked user gets their own public shame chamber
- **Progressive Jail Times** - Escalating punishments (5/10/15 minutes)
- **Admin Protection** - Admins are immune to bonking (they have power for a reason!)
- **Auto-Recovery** - Bot automatically fixes broken permissions on restart

### 💰 **Economy & Shop System**
- **Daily Coin Claims** - Earn 3-6 coins daily with streak bonuses
- **Coin Gifting** - Share wealth with friends (or enemies)
- **Gambling** - Risk it all for big rewards
- **Power-Up Shop** - 6 unique items to enhance your bonking experience

### 🛡️ **Power-Ups Available**
| Power-Up | Price | Effect |
|----------|-------|--------|
| 🛡️ **Bonk Shield** | 25 coins | Block the next bonk attempt |
| 🌟 **1-Hour Immunity** | 50 coins | Cannot be bonked for 1 hour |
| 💰 **Double Coin Boost** | 30 coins | Earn double coins from claims for 24h |
| 🗝️ **Parole Pass** | 40 coins | Next jail sentence reduced by 50% |
| ⚡ **Bonk Power Boost** | 35 coins | Next bonk jails target for double time |
| 🍀 **Lucky Charm** | 45 coins | Next gamble has +20% better odds |

### 📊 **Statistics & Events**
- **Comprehensive Stats** - Track bonks given/received, jail time, streaks
- **Leaderboards** - See who's the ultimate bonker
- **Special Events** - Bonk Roulette can backfire spectacularly
- **Admin Tools** - Manage events, immunity, and emergency releases

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **Discord Bot Token** ([Create one here](https://discord.com/developers/applications))
- **Basic Discord permissions** (Manage Roles, Manage Channels, Send Messages)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AhmedViam/Bonk-bot.git
   cd Bonk-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your bot**
   ```bash
   # Create config.json
   {
     "token": "YOUR_BOT_TOKEN",
     "clientId": "YOUR_BOT_CLIENT_ID",
     "guildId": "YOUR_GUILD_ID"
   }
   ```

4. **Deploy commands**
   ```bash
   node deploy-commands.js
   ```

5. **Start the bot**
   ```bash
   node main.js
   ```

---

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
- `/bonkshop browse` - Browse available power-ups
- `/bonkshop buy item` - Purchase power-ups
- `/bonkshop inventory` - Check your items
- `/bonkshop use item` - Activate power-ups

### Utility Commands
- `/bonkstats` - View detailed statistics
- `/bonkadmin` - Admin management tools
- `/bonkevents` - Special event controls

---

## 🔧 Configuration

### Required Permissions
The bot needs these Discord permissions:
- `Manage Roles` - Create and assign jail roles
- `Manage Channels` - Create individual jail channels
- `Send Messages` - Basic communication
- `Embed Links` - Rich message formatting
- `View Channels` - Access server channels

### Environment Setup
Create a `.env` file for secure token storage:
```env
DISCORD_TOKEN=your_bot_token_here
```

### Customization
- Modify jail times in command files
- Adjust coin rewards in `bonkclaim.js`
- Add new power-ups in `bonkshop.js`
- Configure special events in `bonkevents.js`

---

## 🛠️ Technical Details

### Built With
- **Discord.js v14** - Discord API wrapper
- **Node.js** - Runtime environment
- **JSON** - Data persistence (lightweight and portable)

### File Structure
```
bonk-bot/
├── commands/utility/     # All slash commands
├── main.js              # Bot entry point
├── deploy-commands.js   # Command registration
├── emergency-release.js # Emergency jail cleanup
├── package.json         # Dependencies
└── README.md           # You are here!
```

### Data Management
- User data stored in `data.json`
- Automatic backups on every save
- Startup recovery for crash scenarios
- Individual jail channel cleanup

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Ideas for Contributions
- 🎨 New power-ups and shop items
- 🎲 Additional special events
- 📊 Enhanced statistics tracking
- 🎵 Sound effect integration
- 🌍 Multi-language support

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🎉 Fun Facts

- Over **2,700+ lines** of carefully crafted chaos
- **18 unique commands** for maximum bonking potential
- **6 power-ups** to strategize your bonking game
- **Individual jail system** - no more shared shame!
- **Auto-recovery** system prevents permanent jail bugs

---

## 🆘 Support

Having issues? We've got you covered:

- 📖 **Check the [Issues](https://github.com/AhmedViam/Bonk-bot/issues)** for common problems
- 💬 **Join our Discord** (coming soon!)
- 📧 **Contact the developer** via GitHub

---

## ⭐ Show Your Support

If you found this bot hilarious and useful, please consider:
- Giving it a ⭐ **star** on GitHub
- 🔄 **Sharing** it with friends
- 🐛 **Reporting bugs** to help improve it
- 💡 **Suggesting features** for future updates

---

<div align="center">

**Made with ❤️ and a lot of ☕ by [Marrow](https://github.com/AhmedViam)**

*Remember: Bonk responsibly!* 🔨

</div>
