/**
 * @file bonkhelp.js
 * @description Help command providing comprehensive guide to the bonk system
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-02
 * @version 2.0.0
 * 
 * @changelog
 * - 2.0.0 (2024-08-02): Major update with Bonk Reflect, updated daily rewards (8-20 coins), comprehensive admin commands, enhanced shop descriptions
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
		const config = interaction.client.config;
		const jailTimes = config.jailSettings.jailTimes;
		
		const embed = new EmbedBuilder()
			.setTitle('🔨 Bonk System Guide')
			.setDescription('Welcome to the Bonk Bot! Here\'s how it works:')
			.addFields(
				{
					name: '🪙 Daily Coins',
					value: 'Get 8-20 bonk coins daily with `/bonkclaim` (streak bonuses!).\nCoins accumulate over time and never reset.\nUse `/bonkbalance` to check your current coins.',
					inline: false
				},
				{
					name: '🔨 Bonking Users',
					value: `Use \`/bonk @user\` to bonk someone and send them to their own jail!\nCosts 1 coin and creates a personal jail channel for ${jailTimes.regular} ${jailTimes.regular === 1 ? 'minute' : 'minutes'}.`,
					inline: false
				},
				{
					name: '🔒 Individual Jails',
					value: 'Each user gets their own public jail channel.\nEveryone can see and chat with the jailed person.\nJail channels auto-delete after release.',
					inline: false
				},
				{
					name: '📋 Commands',
					value: `**Core Commands:**\n\`/bonk @user\` - Bonk a user (${jailTimes.regular} min jail, 1 coin)\n\`/bonkmega @user\` - Mega bonk (${jailTimes.mega} min jail, 2 coins)\n\`/bonksoft @user\` - Soft bonk (${jailTimes.soft} min jail, 1 coin)\n\n**Economy Commands:**\n\`/bonkclaim\` - Daily coin claim (8-20 coins)\n\`/bonkbalance [user]\` - Check bonk coins\n\`/bonkgamble <amount>\` - Gamble coins\n\`/bonkgift @user <amount>\` - Gift coins\n\n**Shop Commands:**\n\`/bonkshop browse\` - View all power-ups\n\`/bonkshop buy <item>\` - Purchase power-ups\n\`/bonkshop inventory\` - Check your items\n\`/bonkshop use <item>\` - Activate power-ups\n\n**Info Commands:**\n\`/bonkstats [user]\` - View detailed statistics\n\`/bonkhelp\` - This help message\n\n**Admin Commands:**\n\`/bonkadmin\` - Admin management tools\n\`/bonkevents\` - Special event controls\n\`/bonkpanic\` - 🚨 Emergency: Release all jailed users`,
					inline: false
				},
				{
					name: '🏪 Shop & Power-ups',
					value: '• **🛡️ Bonk Shield** - Block next bonk (25 coins)\n• **🌟 1-Hour Immunity** - Cannot be bonked for 1 hour (50 coins)\n• **💰 Double Coin Boost** - Earn double coins for 24h (30 coins)\n• **🗝️ Parole Pass** - Next jail sentence reduced by 50% (40 coins)\n• **⚡ Bonk Power Boost** - Next bonk jails target for double time (35 coins)\n• **🍀 Lucky Charm** - Next gamble has +20% better odds (45 coins)\n• **↩️ Bonk Reflect** - Next bonk bounces back to attacker (55 coins)',
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
