/**
 * @file bonkadmin.js
 * @description Administrative tools for bot management and user oversight
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 2.0.0
 * 
 * @changelog
 * - 2.0.0 (2024-08-01): Major overhaul with shop integration and power-up management
 * - 1.8.0 (2024-07-31): Added individual jail management tools
 * - 1.5.0 (2024-07-31): Enhanced with coin manipulation features
 * - 1.3.0 (2024-07-31): Added immunity and special event controls
 * - 1.1.0 (2024-07-31): Expanded admin permissions and safety checks
 * - 1.0.0 (2024-07-31): Initial admin command suite
 * 
 * @dependencies discord.js
 * @permissions Administrator (required for access)
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkadmin')
		.setDescription('Admin commands for the bonk system')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('release')
				.setDescription('Release a user from horny jail early')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('The user to release')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('addcredits')
				.setDescription('Add bonk credits to a user')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('The user to give credits to')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('amount')
						.setDescription('Amount of credits to add')
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(10)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('reset')
				.setDescription('Reset all user data (use with caution!)')),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'release') {
			const user = interaction.options.getUser('user');
			const userData = interaction.client.getUserData(user.id);

			if (!userData.isInJail) {
				return await interaction.reply({ 
					content: `${user.displayName} is not in horny jail!`, 
					ephemeral: true 
				});
			}

			// Release from jail
			userData.isInJail = false;
			userData.jailEndTime = null;

			// Restore roles
			try {
				const member = await interaction.guild.members.fetch(user.id);
				const jailRole = interaction.guild.roles.cache.find(role => role.name === interaction.client.config.jailSettings?.roleName || 'Horny Jail');
				
				if (member.roles.cache.has(jailRole?.id)) {
					// Restore original roles
					const rolesToRestore = userData.originalRoles || [];
					const validRoles = rolesToRestore.filter(roleId => interaction.guild.roles.cache.has(roleId));
					
					await member.roles.set(validRoles, `Released early by ${interaction.user.tag}`);
					
					// Delete the individual jail channel if it exists
					if (userData.jailChannelId) {
						try {
							const jailChannel = interaction.guild.channels.cache.get(userData.jailChannelId);
							if (jailChannel) {
								await jailChannel.send(`🔓 ${member} has been released early by an admin! This channel will be deleted in 5 seconds. 🎉`);
								const channelIdToDelete = userData.jailChannelId; // Store before deleting from userData
								delete userData.jailChannelId; // Clean up userData first
								setTimeout(async () => {
									try {
										const channelToDelete = interaction.guild.channels.cache.get(channelIdToDelete);
										if (channelToDelete) {
											await channelToDelete.delete('User released early by admin');
											console.log(`Admin deleted individual jail channel for ${member.user.tag}`);
										}
									} catch (deleteError) {
										console.error(`Error deleting jail channel:`, deleteError);
									}
								}, 5000);
							} else {
								delete userData.jailChannelId; // Channel doesn't exist, clean up
							}
						} catch (error) {
							console.error(`Error handling jail channel cleanup:`, error);
							delete userData.jailChannelId; // Clean up on error
						}
					}
				}
				
				// Clean up stored roles
				delete userData.originalRoles;
			} catch (error) {
				console.error('Error releasing user:', error);
			}

			interaction.client.saveData();

			await interaction.reply({ content: `✅ Released ${user.displayName} from horny jail early!`, ephemeral: true });

		} else if (subcommand === 'addcredits') {
			const user = interaction.options.getUser('user');
			const amount = interaction.options.getInteger('amount');
			const userData = interaction.client.getUserData(user.id);

			userData.bonkCredits += amount;
			interaction.client.saveData();

			await interaction.reply({ content: `✅ Added ${amount} bonk credits to ${user.displayName}! They now have ${userData.bonkCredits} credits.`, ephemeral: true });

		} else if (subcommand === 'reset') {
			// Clear all user data
			const fs = require('node:fs');
			const path = require('node:path');
			const dataPath = path.join(__dirname, '../../data.json');
			
			fs.writeFileSync(dataPath, '{}');
			
			await interaction.reply({ content: '⚠️ All user data has been reset!', ephemeral: true });
		}
	},
};
