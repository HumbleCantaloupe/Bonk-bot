# 🔨 Discord Bonk Bot

> **A Discord bot for sending Muskulhige Hiya folks to horny jai---

## 🌐 Deployment Options

### 🖥️ **---

## 🎮 Commands

### Core Commands Hosting (Recommended for Testing)**h style!**

[![Discord.js](https://img.shields.io/badge/discord.js-v14.21.0-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/node.js-v18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/AhmedViam/Bonk-bot?style=social)](https://github.com/AhmedViam/Bonk-bot/stargazers)

## 🎯 What is Bonk Bot?

A fun Discord bot created for the chaotic **Muskulhige Hiya** server (where apparently everyone needed more bonking). Send your horny friends to **individual horny jail channels** where everyone can watch their shame unfold. With a full economy system, power-ups, and enough customization to make every bonk memorable.

![Bonk Demo](https://c.tenor.com/DuN47QciYfsAAAAC/tenor.gif)

---

## ✨ Features

### 🔨 **Core Bonking System**
- **Individual Jail Channels** - Each bonked user gets their own public shame chamber
- **Progressive Jail Times** - Escalating punishments (5/10/15 minutes)
- **Admin Protection** - Server owner and admins are immune to bonking
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

## � Deployment Options

### 🖥️ **Local Hosting (Recommended for Testing)**
Perfect for development and small servers:
- Run on your personal computer
- Free but requires your computer to stay online
- Easy setup and debugging

### ☁️ **Cloud Hosting (Recommended for Production)**

#### **Free Options:**
- **[Railway](https://railway.app/)** - Easy deployment, generous free tier
- **[Render](https://render.com/)** - Simple setup, auto-deploys from GitHub
- **[Heroku](https://heroku.com/)** - Popular choice, easy scaling

#### **Paid Options:**
- **[DigitalOcean](https://digitalocean.com/)** - $5/month droplets
- **[AWS EC2](https://aws.amazon.com/ec2/)** - Scalable, pay-as-you-use
- **[Google Cloud Platform](https://cloud.google.com/)** - Reliable infrastructure

### 📋 **Deployment Steps**

1. **Fork this repository** to your GitHub account
2. **Choose a hosting platform** from the options above
3. **Connect your GitHub repo** to the hosting service
4. **Set environment variables:**
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_bot_client_id
   GUILD_ID=your_server_id
   ```
5. **Deploy and enjoy!** 🎉

### 💡 **Pro Tips**
- Use environment variables instead of `config.json` for production
- Enable auto-deploy from your main branch
- Monitor your bot's uptime and performance
- Keep your token secure and never commit it to GitHub

---

## �🎮 Commands

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
- `/bonkpanic` - 🚨 Emergency: Release all jailed users (Admin only)

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

<div align="center">

**Made with ❤️ and a lot of ☕ by [Marrow](https://github.com/AhmedViam)**

*Remember: Bonk responsibly!* 🔨

</div>
