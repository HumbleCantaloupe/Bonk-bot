/**
 * @file bonkdebug.js
 * @description Debug jail timestamps and manually fix stuck users
 * @author Marrow
 * @created 2024-08-02
 * @version 1.0.0
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkdebug')
		.setDescription('🐛 Debug jail timestamps and fix stuck users (admin only)')
		.setDefaultMemberPermissions('0') // Administrator only
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User to debug (leave empty for all jailed users)')
				.setRequired(false)),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const targetUser = interaction.options.getUser('user');
		const fs = require('fs');
		
		// Load user data
		let userData = {};
		try {
			const data = fs.readFileSync('./data.json', 'utf8');
			userData = JSON.parse(data);
		} catch (error) {
			return await interaction.editReply({
				content: '❌ Error loading user data.'
			});
		}

		const now = Date.now();
		let response = `🐛 **Jail Debug Report**\n\n`;
		response += `⏰ Current time: ${new Date(now).toLocaleString()}\n`;
		response += `📊 Current timestamp: ${now}\n\n`;

		let jailedUsers = [];
		
		// Find jailed users
		for (const userId in userData) {
			const user = userData[userId];
			if (user.isInJail) {
				jailedUsers.push({ userId, user });
			}
		}

		if (jailedUsers.length === 0) {
			response += '✅ No users currently in jail.';
		} else {
			response += `🔒 **Jailed Users (${jailedUsers.length}):**\n\n`;
			
			for (const { userId, user } of jailedUsers) {
				const member = await interaction.guild.members.fetch(userId).catch(() => null);
				const username = member ? member.user.tag : `Unknown (${userId})`;
				
				const endTime = user.jailEndTime || 0;
				const timeLeft = endTime - now;
				const shouldBeReleased = timeLeft <= 0;
				
				response += `👤 **${username}**\n`;
				response += `📅 End timestamp: ${endTime}\n`;
				response += `⏰ End time: ${new Date(endTime).toLocaleString()}\n`;
				response += `⌛ Time left: ${Math.ceil(timeLeft / 60000)} minutes\n`;
				response += `🔓 Should release: ${shouldBeReleased ? '**YES**' : 'NO'}\n`;
				response += `📂 Original roles: ${user.originalRoles ? user.originalRoles.length : 0}\n`;
				response += `🏠 Jail channel: ${user.jailChannelId || 'None'}\n\n`;
				
				// If targeting specific user or if they should be released, fix them
				if (targetUser && targetUser.id === userId || shouldBeReleased) {
					const jailRoleName = interaction.client.config.jailSettings?.roleName || 'Horny Jail';
					const jailRole = interaction.guild.roles.cache.find(role => role.name === jailRoleName);
					
					if (member && jailRole && member.roles.cache.has(jailRole.id)) {
						try {
							// Force release
							user.isInJail = false;
							user.jailEndTime = null;
							
							// Remove jail role and restore original roles
							if (user.originalRoles && user.originalRoles.length > 0) {
								await member.roles.set(user.originalRoles, 'Manual debug fix');
								response += `✅ **FIXED**: Restored ${user.originalRoles.length} roles\n`;
							} else {
								await member.roles.remove(jailRole.id, 'Manual debug fix');
								response += `✅ **FIXED**: Removed jail role (no original roles)\n`;
							}
							
							// Clean up data
							delete user.originalRoles;
							if (user.jailChannelId) {
								const jailChannel = interaction.guild.channels.cache.get(user.jailChannelId);
								if (jailChannel) {
									await jailChannel.delete('Debug fix - user released');
									response += `✅ **FIXED**: Deleted jail channel\n`;
								}
								delete user.jailChannelId;
							}
							
						} catch (error) {
							response += `❌ **ERROR**: ${error.message}\n`;
						}
					}
				}
				
				response += `---\n`;
			}
		}

		// Save data if changes were made
		try {
			fs.writeFileSync('./data.json', JSON.stringify(userData, null, 2));
		} catch (error) {
			response += `\n❌ Error saving data: ${error.message}`;
		}

		// Split response if too long
		if (response.length > 2000) {
			const parts = response.match(/[\s\S]{1,1900}/g);
			await interaction.editReply({ content: parts[0] });
			for (let i = 1; i < parts.length; i++) {
				await interaction.followUp({ content: parts[i], ephemeral: true });
			}
		} else {
			await interaction.editReply({ content: response });
		}
	},
};
