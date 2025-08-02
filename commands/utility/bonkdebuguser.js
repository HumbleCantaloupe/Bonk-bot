/**
 * @file bonkdebuguser.js
 * @description Debug command to investigate specific user's jail state
 * @author Marrow
 * @created 2025-08-02
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkdebuguser')
		.setDescription('Debug a specific user\'s jail state')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User to debug')
				.setRequired(true)),
	async execute(interaction) {
		// Admin only
		if (!interaction.member.permissions.has('Administrator')) {
			return interaction.reply({ content: '❌ This command requires Administrator permissions.', ephemeral: true });
		}

		const target = interaction.options.getUser('user');
		const member = interaction.guild.members.cache.get(target.id);

		if (!member) {
			return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
		}

		// Load user data
		const dataPath = path.join(__dirname, '..', '..', 'data.json');
		let userData = {};
		try {
			if (fs.existsSync(dataPath)) {
				userData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
			}
		} catch (error) {
			console.error('Error loading data:', error);
		}

		const userInfo = userData[target.id] || {};
		const config = interaction.client.config;
		const jailRoleName = config.jailSettings?.roleName || 'Horny Jail';
		const jailRole = interaction.guild.roles.cache.find(role => role.name === jailRoleName);

		let debugInfo = `**Debug Info for ${target.tag}**\n`;
		debugInfo += `**User ID:** ${target.id}\n`;
		debugInfo += `**Member Found:** ${member ? 'Yes' : 'No'}\n\n`;

		debugInfo += `**Data State:**\n`;
		debugInfo += `- isInJail: ${userInfo.isInJail || false}\n`;
		debugInfo += `- jailEndTime: ${userInfo.jailEndTime || 'null'}\n`;
		debugInfo += `- jailChannelId: ${userInfo.jailChannelId || 'null'}\n`;
		debugInfo += `- originalRoles: ${userInfo.originalRoles ? JSON.stringify(userInfo.originalRoles) : 'null'}\n`;
		debugInfo += `- originalRolesDebug: ${userInfo.originalRolesDebug ? JSON.stringify(userInfo.originalRolesDebug) : 'null'}\n\n`;

		debugInfo += `**Discord State:**\n`;
		debugInfo += `- Jail Role Name: ${jailRoleName}\n`;
		debugInfo += `- Jail Role Found: ${jailRole ? 'Yes' : 'No'}\n`;
		debugInfo += `- Has Jail Role: ${jailRole && member.roles.cache.has(jailRole.id) ? 'Yes' : 'No'}\n`;
		debugInfo += `- Current Roles: ${member.roles.cache.map(r => r.name).join(', ')}\n\n`;

		if (userInfo.jailEndTime) {
			const timeLeft = userInfo.jailEndTime - Date.now();
			debugInfo += `**Time Info:**\n`;
			debugInfo += `- Current Time: ${new Date().toISOString()}\n`;
			debugInfo += `- Jail End Time: ${new Date(userInfo.jailEndTime).toISOString()}\n`;
			debugInfo += `- Time Left: ${timeLeft > 0 ? `${Math.ceil(timeLeft / 60000)} minutes` : 'Expired'}\n\n`;
		}

		// Check for jail channel
		if (userInfo.jailChannelId) {
			const jailChannel = interaction.guild.channels.cache.get(userInfo.jailChannelId);
			debugInfo += `**Jail Channel:**\n`;
			debugInfo += `- Channel ID: ${userInfo.jailChannelId}\n`;
			debugInfo += `- Channel Exists: ${jailChannel ? 'Yes' : 'No'}\n`;
			if (jailChannel) {
				debugInfo += `- Channel Name: ${jailChannel.name}\n`;
			}
		}

		const embed = new EmbedBuilder()
			.setTitle('🔍 User Debug Report')
			.setDescription(debugInfo)
			.setColor('#FF0000')
			.setTimestamp();

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
