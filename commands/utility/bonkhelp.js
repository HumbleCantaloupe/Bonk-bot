/**
 * @file bonkhelp.js
 * @description Help command providing comprehensive guide to the bonk system
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.4.0
 * 
 * @changelog
 * - 1.4.0 (2024-08-01): Updated with shop system, new jail times, admin protection info
 * - 1.3.0 (2024-07-31): Revised for individual jail system and coin economy
 * - 1.2.0 (2024-07-31): Added special events and immunity information
 * - 1.1.0 (2024-07-31): Updated for coin-based economy transition
 * - 1.0.0 (2024-07-31): Initial help system with basic command documentation
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkhelp')
		.setDescription('Learn about the bonk system'),
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setTitle('🔨 Bonk System Guide')
			.setDescription('Welcome to the Bonk Bot! Here\'s how it works:')
			.addFields(
				{
					name: '🪙 Daily Coins',
					value: 'Get 3-6 bonk coins daily with `/bonkclaim`.\nCoins accumulate over time and never reset.\nUse `/bonkbalance` to check your current coins.',
					inline: false
				},
				{
					name: '🔨 Bonking Users',
					value: 'Use `/bonk @user` to bonk someone and send them to their own jail!\nCosts 1 coin and creates a personal jail channel for 10 minutes.',
					inline: false
				},
				{
					name: '🔒 Individual Jails',
					value: 'Each user gets their own public jail channel.\nEveryone can see and chat with the jailed person.\nJail channels auto-delete after release.',
					inline: false
				},
				{
					name: '📋 Commands',
					value: '`/bonk @user` - Bonk a user (10 min jail, 1 coin)\n`/bonkmega @user` - Mega bonk (15 min jail, 2 coins)\n`/bonksoft @user` - Soft bonk (5 min jail, 1 coin)\n`/bonkbalance [user]` - Check bonk coins\n`/bonkclaim` - Daily coin claim\n`/bonkgamble <amount>` - Gamble coins\n`/bonkgift @user <amount>` - Gift coins\n`/bonkshop` - Browse, buy, and use power-ups\n`/bonkstats [user]` - View stats\n`/bonkpanic` - 🚨 Emergency: Release all jailed users (Admin only)\n`/bonkhelp` - This help message',
					inline: false
				},
				{
					name: '🏪 Shop & Power-ups',
					value: '• **🛡️ Shield** - Block next bonk (25 coins)\n• **🌟 Immunity** - 1-hour protection (50 coins)\n• **💰 Double Coins** - 24h claim boost (30 coins)\n• **🗝️ Parole Pass** - Half next sentence (40 coins)\n• **⚡ Bonk Boost** - Double next jail time (35 coins)\n• **🍀 Lucky Charm** - Better gambling odds (45 coins)',
					inline: false
				},
				{
					name: '⚖️ Rules',
					value: '• You cannot bonk yourself, bots, server owner, or admins\n• Users already in jail cannot be bonked again\n• All bonk variants cost coins (1-2 coins each)\n• Jails are public - everyone can see and chat\n• Server owner and users with Administrator permission are protected',
					inline: false
				},
				{
					name: '🎮 Special Features',
					value: '• **Individual Jails** - Each user gets their own jail channel\n• **Coin Economy** - Earn, gamble, and gift coins\n• **Power-up Shop** - Buy shields, boosts, and special effects\n• **Statistics** - Track your bonk performance\n• **Auto-Recovery** - Bot fixes broken permissions on restart',
					inline: false
				}
			)
			.setColor('#FF69B4')
			.setThumbnail('https://media.tenor.com/rg7CdXzEsokAAAAM/bonk-doge.gif')
			.setFooter({ text: 'Have fun and bonk responsibly!' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
