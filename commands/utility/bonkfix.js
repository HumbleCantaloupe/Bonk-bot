/**
 * @file bonkfix.js
 * @description Manual role restoration command for when auto-release fails
 * @author Marrow
 * @created 2024-08-02
 * @version 1.0.0
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkfix')
		.setDescription('🔧 Manually restore roles and fix stuck users (admin only)')
		.setDefaultMemberPermissions('0') // Administrator only
		.addUserOption(option =>
			option.setName('user')
				.setDescription('The user to fix (leave empty to fix all stuck users)')
				.setRequired(false)),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const targetUser = interaction.options.getUser('user');
		const jailRoleName = interaction.client.config.jailSettings?.roleName || 'Horny Jail';
		const jailRole = interaction.guild.roles.cache.find(role => role.name === jailRoleName);

		if (!jailRole) {
			return await interaction.editReply({
				content: `❌ Jail role "${jailRoleName}" not found in this server.`
			});
		}

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

		let fixedUsers = [];
		let errors = [];

		if (targetUser) {
			// Fix specific user
			const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
			if (!member) {
				return await interaction.editReply({
					content: '❌ User not found in this server.'
				});
			}

			if (member.roles.cache.has(jailRole.id)) {
				try {
					// Remove jail role
					await member.roles.remove(jailRole.id, 'Manual fix by admin');
					
					// Try to restore from backup roles if they exist
					const userRecord = userData[targetUser.id];
					console.log(`[BONKFIX] User record for ${targetUser.tag}:`, userRecord);
					
					if (userRecord && userRecord.originalRoles && userRecord.originalRoles.length > 0) {
						console.log(`[BONKFIX] Original roles found:`, userRecord.originalRoles);
						if (userRecord.originalRolesDebug) {
							console.log(`[BONKFIX] Role details:`, userRecord.originalRolesDebug);
						}
						
						// Validate that the roles still exist in the server
						const validRoles = userRecord.originalRoles.filter(roleId => 
							interaction.guild.roles.cache.has(roleId)
						);
						
						const invalidRoles = userRecord.originalRoles.filter(roleId => 
							!interaction.guild.roles.cache.has(roleId)
						);
						
						if (invalidRoles.length > 0) {
							console.log(`[BONKFIX] Invalid roles (no longer exist):`, invalidRoles);
						}
						
						if (validRoles.length > 0) {
							console.log(`[BONKFIX] Restoring valid roles:`, validRoles);
							await member.roles.add(validRoles, 'Manual role restoration');
							fixedUsers.push(`${member.user.tag} - restored ${validRoles.length}/${userRecord.originalRoles.length} roles`);
						} else {
							fixedUsers.push(`${member.user.tag} - removed jail role (backup roles no longer exist)`);
						}
						delete userRecord.originalRoles;
						delete userRecord.originalRolesDebug;
					} else {
						console.log(`[BONKFIX] No original roles found for ${targetUser.tag}`);
						fixedUsers.push(`${member.user.tag} - removed jail role (no backup roles found)`);
					}

					// Clean up jail data
					if (userRecord) {
						userRecord.isInJail = false;
						userRecord.jailEndTime = null;
						delete userRecord.jailChannelId;
					}
				} catch (error) {
					errors.push(`${member.user.tag}: ${error.message}`);
				}
			} else {
				return await interaction.editReply({
					content: `✅ ${member.user.tag} is not in jail.`
				});
			}
		} else {
			// Fix all users with jail role - fetch fresh member data
			await interaction.guild.members.fetch(); // Ensure member cache is up to date
			
			const membersWithJailRole = interaction.guild.members.cache.filter(member => 
				member.roles.cache.has(jailRole.id)
			);

			if (membersWithJailRole.size === 0) {
				return await interaction.editReply({
					content: '✅ No users found with jail role.'
				});
			}

			for (const [userId, member] of membersWithJailRole) {
				try {
					// Remove jail role
					await member.roles.remove(jailRole.id, 'Manual bulk fix by admin');
					
					// Try to restore from backup roles if they exist
					const userRecord = userData[userId];
					if (userRecord && userRecord.originalRoles && userRecord.originalRoles.length > 0) {
						// Validate that the roles still exist in the server
						const validRoles = userRecord.originalRoles.filter(roleId => 
							interaction.guild.roles.cache.has(roleId)
						);
						
						if (validRoles.length > 0) {
							await member.roles.add(validRoles, 'Manual role restoration');
							fixedUsers.push(`${member.user.tag} - restored ${validRoles.length}/${userRecord.originalRoles.length} roles`);
						} else {
							fixedUsers.push(`${member.user.tag} - removed jail role (backup roles no longer exist)`);
						}
						delete userRecord.originalRoles;
					} else {
						fixedUsers.push(`${member.user.tag} - removed jail role (no backup roles found)`);
					}

					// Clean up jail data
					if (userRecord) {
						userRecord.isInJail = false;
						userRecord.jailEndTime = null;
						delete userRecord.jailChannelId;
					}
				} catch (error) {
					errors.push(`${member.user.tag}: ${error.message}`);
				}
			}
		}

		// Save updated data
		try {
			fs.writeFileSync('./data.json', JSON.stringify(userData, null, 2));
		} catch (error) {
			errors.push('Failed to save user data');
		}

		// Create response
		let response = `🔧 **Manual Fix Complete**\n\n`;
		
		if (fixedUsers.length > 0) {
			response += `✅ **Fixed Users (${fixedUsers.length}):**\n`;
			for (const user of fixedUsers) {
				response += `• ${user}\n`;
			}
		}

		if (errors.length > 0) {
			response += `\n❌ **Errors (${errors.length}):**\n`;
			for (const error of errors) {
				response += `• ${error}\n`;
			}
		}

		if (fixedUsers.length === 0 && errors.length === 0) {
			response += '✅ No users needed fixing.';
		}

		await interaction.editReply({
			content: response
		});
	},
};
