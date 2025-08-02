/**
 * @file bonktest.js
 * @description Test command for debugging jail release system
 * @author Marrow
 * @created 2024-08-02
 * @version 1.0.0
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonktest')
		.setDescription('🔧 Test jail release system (admin only)')
		.setDefaultMemberPermissions('0'), // Administrator only

	async execute(interaction) {
		// Load current user data
		const fs = require('fs');
		let userData = {};
		try {
			const data = fs.readFileSync('./data.json', 'utf8');
			userData = JSON.parse(data);
		} catch (error) {
			console.error('Error loading user data:', error);
		}

		// Find jailed users
		const jailedUsers = [];
		const now = Date.now();
		
		for (const userId in userData) {
			const user = userData[userId];
			if (user.isInJail) {
				const timeLeft = user.jailEndTime ? user.jailEndTime - now : 0;
				jailedUsers.push({
					userId,
					timeLeft: Math.max(0, timeLeft),
					endTime: user.jailEndTime ? new Date(user.jailEndTime).toLocaleTimeString() : 'Unknown'
				});
			}
		}

		if (jailedUsers.length === 0) {
			return await interaction.reply({
				content: '✅ No users currently in jail.',
				ephemeral: true
			});
		}

		let response = `🔍 **Jail Status Debug Report**\n\n`;
		for (const jailed of jailedUsers) {
			const member = await interaction.guild.members.fetch(jailed.userId).catch(() => null);
			const username = member ? member.user.tag : `Unknown User (${jailed.userId})`;
			const timeLeftMin = Math.ceil(jailed.timeLeft / 60000);
			
			response += `👤 **${username}**\n`;
			response += `⏰ Release time: ${jailed.endTime}\n`;
			response += `⌛ Time left: ${timeLeftMin} minutes\n`;
			response += `🔒 Should be released: ${jailed.timeLeft <= 0 ? 'YES' : 'NO'}\n\n`;
		}

		await interaction.reply({
			content: response,
			ephemeral: true
		});
	},
};
