/**
 * @file bonkstats.js
 * @description Statistics and leaderboard system for bonk performance tracking
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.6.0
 * 
 * @changelog
 * - 1.6.0 (2024-08-01): Added shop purchase statistics and power-up usage
 * - 1.5.0 (2024-07-31): Enhanced leaderboards with coin economy stats
 * - 1.4.0 (2024-07-31): Added streak tracking and performance ratios
 * - 1.3.0 (2024-07-31): Implemented global leaderboards
 * - 1.2.0 (2024-07-31): Added personal achievement tracking
 * - 1.0.0 (2024-07-31): Initial stats system with basic metrics
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkstats')
		.setDescription('View bonk leaderboards and statistics')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('Type of leaderboard to show')
				.setRequired(false)
				.addChoices(
					{ name: 'Top Bonkers', value: 'bonkers' },
					{ name: 'Most Bonked', value: 'victims' },
					{ name: 'Longest Streaks', value: 'streaks' },
					{ name: 'Longest Jail Times', value: 'jailtime' },
					{ name: 'Personal Stats', value: 'personal' }
				))
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User to show personal stats for (only works with personal stats)')
				.setRequired(false)),
	async execute(interaction) {
		const type = interaction.options.getString('type') || 'bonkers';
		const targetUser = interaction.options.getUser('user') || interaction.user;
		
		const userData = require('../../data.json');
		
		if (type === 'personal') {
			const userStats = interaction.client.getUserData(targetUser.id);
			
			const embed = new EmbedBuilder()
				.setTitle(`📊 ${targetUser.displayName}'s Bonk Stats`)
				.setThumbnail(targetUser.displayAvatarURL())
				.addFields(
					{ name: '🔨 Bonks Given', value: `${userStats.totalBonksGiven}`, inline: true },
					{ name: '💥 Bonks Received', value: `${userStats.totalBonksReceived}`, inline: true },
					{ name: '💰 Current Credits', value: `${userStats.bonkCredits}`, inline: true },
					{ name: '🔥 Current Streak', value: `${userStats.bonkStreak}`, inline: true },
					{ name: '⏱️ Longest Jail', value: userStats.longestJailTime ? `${Math.round(userStats.longestJailTime / 60000)} minutes` : '0 minutes', inline: true },
					{ name: '🏆 Bonk Ratio', value: userStats.totalBonksReceived > 0 ? `${(userStats.totalBonksGiven / userStats.totalBonksReceived).toFixed(2)}` : userStats.totalBonksGiven > 0 ? '∞' : '0', inline: true }
				)
				.setColor('#4169E1')
				.setTimestamp();
			
			if (userStats.isInJail) {
				const timeLeft = Math.max(0, userStats.jailEndTime - Date.now());
				const minutesLeft = Math.ceil(timeLeft / 60000);
				embed.addFields({ 
					name: '🔒 Current Status', 
					value: `In horny jail for ${minutesLeft} more minute(s)`, 
					inline: false 
				});
			}
			
			return await interaction.reply({ embeds: [embed] });
		}
		
		let sortedUsers = [];
		let title = '';
		let description = '';
		
		switch (type) {
			case 'bonkers':
				sortedUsers = Object.entries(userData)
					.filter(([userId, data]) => data.totalBonksGiven > 0)
					.sort(([,a], [,b]) => b.totalBonksGiven - a.totalBonksGiven)
					.slice(0, 10);
				title = '🔨 Top Bonkers Leaderboard';
				description = 'The users who have given the most bonks';
				break;
				
			case 'victims':
				sortedUsers = Object.entries(userData)
					.filter(([userId, data]) => data.totalBonksReceived > 0)
					.sort(([,a], [,b]) => b.totalBonksReceived - a.totalBonksReceived)
					.slice(0, 10);
				title = '💥 Most Bonked Leaderboard';
				description = 'The users who have been bonked the most';
				break;
				
			case 'streaks':
				sortedUsers = Object.entries(userData)
					.filter(([userId, data]) => data.bonkStreak > 0)
					.sort(([,a], [,b]) => b.bonkStreak - a.bonkStreak)
					.slice(0, 10);
				title = '🔥 Longest Bonk Streaks';
				description = 'Current consecutive daily bonking streaks';
				break;
				
			case 'jailtime':
				sortedUsers = Object.entries(userData)
					.filter(([userId, data]) => data.longestJailTime > 0)
					.sort(([,a], [,b]) => b.longestJailTime - a.longestJailTime)
					.slice(0, 10);
				title = '⏱️ Longest Jail Sentences';
				description = 'Users with the longest single jail times';
				break;
		}
		
		if (sortedUsers.length === 0) {
			const embed = new EmbedBuilder()
				.setTitle(title)
				.setDescription('No data available yet! Start bonking to see some stats! 🔨')
				.setColor('#FF69B4');
			return await interaction.reply({ embeds: [embed] });
		}
		
		const embed = new EmbedBuilder()
			.setTitle(title)
			.setDescription(description)
			.setColor('#FFD700')
			.setTimestamp();
		
		let leaderboardText = '';
		
		for (let i = 0; i < sortedUsers.length; i++) {
			const [userId, userStats] = sortedUsers[i];
			try {
				const discordUser = await interaction.client.users.fetch(userId);
				const rank = i + 1;
				const medals = ['🥇', '🥈', '🥉'];
				const medal = medals[i] || '🏅';
				
				let value = '';
				switch (type) {
					case 'bonkers':
						value = `${userStats.totalBonksGiven} bonks`;
						break;
					case 'victims':
						value = `${userStats.totalBonksReceived} bonks received`;
						break;
					case 'streaks':
						value = `${userStats.bonkStreak} days`;
						break;
					case 'jailtime':
						value = `${Math.round(userStats.longestJailTime / 60000)} minutes`;
						break;
				}
				
				leaderboardText += `${medal} **${rank}.** ${discordUser.displayName} - ${value}\n`;
			} catch (error) {
				// User not found, skip
			}
		}
		
		embed.setDescription(`${description}\n\n${leaderboardText}`);
		
		await interaction.reply({ embeds: [embed] });
	},
};
