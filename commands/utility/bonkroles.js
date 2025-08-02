/**
 * @file bonkroles.js
 * @description Debug command to check saved role data for users
 * @author Marrow
 * @created 2024-08-02
 * @version 1.0.0
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkroles')
		.setDescription('🔧 Debug: Check saved role data for users (admin only)')
		.setDefaultMemberPermissions('0') // Administrator only
		.addUserOption(option =>
			option.setName('user')
				.setDescription('The user to check role data for')
				.setRequired(false)),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const targetUser = interaction.options.getUser('user');

		// Load user data
		const fs = require('fs');
		let userData = {};
		try {
			const data = fs.readFileSync('./data.json', 'utf8');
			userData = JSON.parse(data);
		} catch (error) {
			return await interaction.editReply({
				content: '❌ Error loading user data.'
			});
		}

		if (targetUser) {
			// Check specific user
			const userRecord = userData[targetUser.id];
			if (!userRecord) {
				return await interaction.editReply({
					content: `❌ No data found for ${targetUser.tag}.`
				});
			}

			let response = `🔍 **Role Data for ${targetUser.tag}**\n\n`;
			response += `**User ID:** ${targetUser.id}\n`;
			response += `**Is In Jail:** ${userRecord.isInJail || false}\n`;
			response += `**Jail End Time:** ${userRecord.jailEndTime || 'None'}\n\n`;

			if (userRecord.originalRoles) {
				response += `**Original Roles (${userRecord.originalRoles.length}):**\n`;
				for (const roleId of userRecord.originalRoles) {
					const role = interaction.guild.roles.cache.get(roleId);
					const roleName = role ? role.name : 'ROLE NOT FOUND';
					response += `• ${roleId} - ${roleName}\n`;
				}
			} else {
				response += `**Original Roles:** None saved\n`;
			}

			if (userRecord.originalRolesDebug) {
				response += `\n**Debug Role Info:**\n`;
				for (const roleInfo of userRecord.originalRolesDebug) {
					const currentRole = interaction.guild.roles.cache.get(roleInfo.id);
					const status = currentRole ? '✅ EXISTS' : '❌ DELETED';
					response += `• ${roleInfo.name} (${roleInfo.id}) - ${status}\n`;
				}
			}

			// Check current roles
			const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
			if (member) {
				response += `\n**Current Roles:**\n`;
				const currentRoles = member.roles.cache.filter(role => role.id !== interaction.guild.roles.everyone.id);
				for (const [roleId, role] of currentRoles) {
					response += `• ${role.name} (${roleId})\n`;
				}
			}

			await interaction.editReply({ content: response });

		} else {
			// Show all users with role data
			let response = `🔍 **All Users with Role Data**\n\n`;
			let count = 0;

			for (const [userId, userRecord] of Object.entries(userData)) {
				if (userRecord.originalRoles && userRecord.originalRoles.length > 0) {
					const user = await interaction.client.users.fetch(userId).catch(() => null);
					const username = user ? user.tag : `Unknown User (${userId})`;
					response += `**${username}:** ${userRecord.originalRoles.length} roles saved\n`;
					count++;
				}
			}

			if (count === 0) {
				response += `No users currently have saved role data.`;
			} else {
				response += `\nTotal: ${count} users with saved roles`;
			}

			await interaction.editReply({ content: response });
		}
	},
};
