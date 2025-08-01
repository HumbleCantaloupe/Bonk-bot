/**
 * @file bonkpanic.js
 * @description Emergency panic command to release all jailed users and restore permissions
 * @author Marrow
 * @created 2024-08-02
 * @lastModified 2024-08-02
 * @version 1.0.0
 * 
 * @changelog
 * - 1.0.0 (2024-08-02): Initial panic command for emergency jail releases
 * 
 * @dependencies discord.js
 * @permissions Administrator (required for safety)
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkpanic')
		.setDescription('🚨 EMERGENCY: Release ALL users from jail and restore permissions!')
		.setDefaultMemberPermissions('0'), // Administrator only
	async execute(interaction) {
		await interaction.deferReply();

		// Double-check admin permissions for safety
		if (!interaction.member.permissions.has(['Administrator']) && interaction.user.id !== interaction.guild.ownerId) {
			return await interaction.editReply({ 
				content: '🚫 Only administrators and the server owner can use the panic command!',
			});
		}

		const userData = interaction.client.getUserData;
		let releasedCount = 0;
		let channelsDeleted = 0;
		let errors = [];

		try {
			// Find the jail role
			const jailRole = interaction.guild.roles.cache.find(role => role.name === 'Horny Jail');
			
			const embed = new EmbedBuilder()
				.setTitle('🚨 PANIC MODE ACTIVATED 🚨')
				.setDescription('Emergency release protocol initiated...')
				.setColor('#FF0000')
				.addFields(
					{ name: '⏳ Status', value: 'Scanning for jailed users...', inline: true }
				)
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });

			// Release all jailed users from data
			for (const userId in interaction.client.userData || {}) {
				const user = interaction.client.userData[userId];
				if (user && user.isInJail) {
					try {
						console.log(`Panic releasing user ${userId}`);
						user.isInJail = false;
						user.jailEndTime = null;
						releasedCount++;

						// Try to find the member and remove jail role
						const member = await interaction.guild.members.fetch(userId).catch(() => null);
						if (member && jailRole && member.roles.cache.has(jailRole.id)) {
							await member.roles.remove(jailRole, 'Panic command - emergency release');
							console.log(`Removed jail role from ${member.user.tag}`);
						}

						// Delete their jail channel if it exists
						if (user.jailChannelId) {
							try {
								const jailChannel = interaction.guild.channels.cache.get(user.jailChannelId);
								if (jailChannel) {
									await jailChannel.delete('Panic command - emergency cleanup');
									channelsDeleted++;
									console.log(`Deleted jail channel for user ${userId}`);
								}
							} catch (channelError) {
								console.error(`Error deleting jail channel for ${userId}:`, channelError);
								errors.push(`Failed to delete jail channel for user ${userId}`);
							}
							delete user.jailChannelId;
						}

						// Clean up other jail-related data
						delete user.originalRoles;

					} catch (error) {
						console.error(`Error releasing user ${userId}:`, error);
						errors.push(`Failed to release user ${userId}: ${error.message}`);
					}
				}
			}

			// Remove jail role permissions from all channels
			if (jailRole) {
				const textChannels = interaction.guild.channels.cache.filter(channel => channel.type === 0);
				let channelsFixed = 0;

				for (const [channelId, channel] of textChannels) {
					try {
						// Remove jail role permission overwrites
						if (channel.permissionOverwrites.cache.has(jailRole.id)) {
							await channel.permissionOverwrites.delete(jailRole);
							channelsFixed++;
						}
					} catch (error) {
						console.error(`Error fixing permissions in ${channel.name}:`, error);
						errors.push(`Failed to fix permissions in #${channel.name}`);
					}
				}

				embed.addFields({
					name: '🔧 Permissions Fixed',
					value: `${channelsFixed} channels`,
					inline: true
				});
			}

			// Clean up any orphaned jail channels
			const orphanedJailChannels = interaction.guild.channels.cache.filter(channel => 
				channel.name.startsWith('horny-jail-') && channel.type === 0
			);

			for (const [channelId, channel] of orphanedJailChannels) {
				try {
					await channel.delete('Panic command - cleaning orphaned jail channels');
					channelsDeleted++;
					console.log(`Deleted orphaned jail channel: ${channel.name}`);
				} catch (error) {
					console.error(`Error deleting orphaned channel ${channel.name}:`, error);
					errors.push(`Failed to delete orphaned channel #${channel.name}`);
				}
			}

			// Save the cleaned data
			interaction.client.saveData();

			// Update the embed with results
			embed.setTitle('✅ PANIC MODE COMPLETE')
				.setDescription('Emergency release protocol completed successfully!')
				.setColor('#00FF00')
				.spliceFields(0, 1, 
					{ name: '👥 Users Released', value: `${releasedCount}`, inline: true },
					{ name: '🗑️ Channels Deleted', value: `${channelsDeleted}`, inline: true },
					{ name: '⚠️ Errors', value: `${errors.length}`, inline: true }
				);

			if (errors.length > 0) {
				const errorText = errors.slice(0, 5).join('\n'); // Show first 5 errors
				const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more` : '';
				embed.addFields({
					name: '❌ Error Details',
					value: `\`\`\`${errorText}${moreErrors}\`\`\``,
					inline: false
				});
			}

			embed.setFooter({ text: `Executed by ${interaction.user.tag}` });

			await interaction.editReply({ embeds: [embed] });

			// Send a follow-up message
			setTimeout(async () => {
				try {
					await interaction.followUp({
						content: `🎉 **FREEDOM FOR ALL!** 🎉\n${releasedCount} users have been released from horny jail!\nAll jail channels have been cleaned up and permissions restored.`,
						ephemeral: false
					});
				} catch (error) {
					console.error('Error sending panic follow-up:', error);
				}
			}, 2000);

		} catch (error) {
			console.error('Critical error in panic command:', error);
			
			const errorEmbed = new EmbedBuilder()
				.setTitle('❌ PANIC MODE FAILED')
				.setDescription('Critical error during emergency release!')
				.addFields({
					name: 'Error Details',
					value: `\`\`\`${error.message}\`\`\``,
					inline: false
				})
				.setColor('#FF0000')
				.setTimestamp();

			await interaction.editReply({ embeds: [errorEmbed] });
		}
	},
};
