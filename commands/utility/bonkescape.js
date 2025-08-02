/**
 * @file bonkescape.js
 * @description Jail escape mechanics - lock picking, jailbreak events, and good behavior
 * @author Marrow
 * @created 2025-08-02
 * @version 1.0.0
 * 
 * @changelog
 * - 1.0.0 (2025-08-02): Initial implementation with lock picking, jailbreak, and good behavior
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkescape')
		.setDescription('Jail escape mechanics - pick locks, organize jailbreaks, or earn good behavior!')
		.addSubcommand(subcommand =>
			subcommand
				.setName('lockpick')
				.setDescription('Pay coins to attempt to pick the lock and escape early!')
				.addIntegerOption(option =>
					option.setName('coins')
						.setDescription('Coins to spend (more coins = better chance)')
						.setRequired(true)
						.setMinValue(5)
						.setMaxValue(50)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('jailbreak')
				.setDescription('Help break someone out of jail (costs coins)')
				.addUserOption(option =>
					option.setName('prisoner')
						.setDescription('The jailed user to help escape')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('coins')
						.setDescription('Coins to contribute to the jailbreak')
						.setRequired(true)
						.setMinValue(10)
						.setMaxValue(100)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('behavior')
				.setDescription('Check your good behavior status and sentence reduction')),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const userData = interaction.client.getUserData(interaction.user.id);

		if (subcommand === 'lockpick') {
			// Check if user is in jail
			if (!userData.isInJail) {
				return await interaction.reply({ 
					content: '🔓 You\'re not in jail! No need to pick any locks.', 
					ephemeral: true 
				});
			}

			const coinsToSpend = interaction.options.getInteger('coins');
			
			// Check if user has enough coins
			if (userData.bonkCoins < coinsToSpend) {
				return await interaction.reply({ 
					content: `🚫 You don't have enough coins! You have ${userData.bonkCoins} coins but need ${coinsToSpend}.`, 
					ephemeral: true 
				});
			}

			// Calculate success chance based on coins spent (5 coins = 10%, 50 coins = 70%)
			// Added bounds checking to prevent negative or invalid values
			const baseChance = 10;
			const maxChance = 70;
			const coinRange = 45; // (50 - 5)
			const chanceRange = 60; // (70 - 10)
			
			const successChance = Math.min(Math.max(
				baseChance + ((coinsToSpend - 5) * (chanceRange / coinRange)), 
				baseChance
			), maxChance);
			
			// Deduct coins
			userData.bonkCoins -= coinsToSpend;
			
			// Roll for success
			const roll = Math.random() * 100;
			const success = roll <= successChance;

			if (success) {
				// Successful escape!
				userData.isInJail = false;
				userData.jailEndTime = null;
				
				// Find user in guild and restore roles
				const member = interaction.guild.members.cache.get(interaction.user.id);
				if (member) {
					const jailRoleName = interaction.client.config.jailSettings?.roleName || 'Horny Jail';
					const jailRole = interaction.guild.roles.cache.find(role => role.name === jailRoleName);
					
					// Always restore original roles if they exist
					if (userData.originalRoles && userData.originalRoles.length > 0) {
						await member.roles.set(userData.originalRoles, 'Lock picking escape - restoring original roles');
					} else if (jailRole && member.roles.cache.has(jailRole.id)) {
						await member.roles.remove(jailRole.id, 'Lock picking escape');
					}
					
					// Delete jail channel
					if (userData.jailChannelId) {
						const jailChannel = interaction.guild.channels.cache.get(userData.jailChannelId);
						if (jailChannel) {
							await jailChannel.send(`🔓 ${interaction.user} has successfully picked the lock and escaped! This channel will be deleted in 5 seconds. Freedom achieved! 🎉`);
							const channelIdToDelete = userData.jailChannelId;
							delete userData.jailChannelId;
							
							// Use a more reliable deletion method
							setTimeout(async () => {
								try {
									const channelToDelete = interaction.guild.channels.cache.get(channelIdToDelete);
									if (channelToDelete) {
										await channelToDelete.delete('User escaped via lock picking');
									}
								} catch (error) {
									console.error('Error deleting jail channel:', error);
								}
							}, 5000);
						} else {
							delete userData.jailChannelId;
						}
					}
				}
				
				// Clean up data
				delete userData.originalRoles;
				delete userData.originalRolesDebug;
				
				interaction.client.saveData();

				const embed = new EmbedBuilder()
					.setTitle('🔓 Lock Picking SUCCESS!')
					.setDescription(`**${interaction.user.displayName}** spent **${coinsToSpend} coins** and successfully picked the lock!\n\n🎉 **FREEDOM ACHIEVED!** 🎉`)
					.addFields(
						{ name: '🎲 Success Chance', value: `${successChance.toFixed(1)}%`, inline: true },
						{ name: '🎯 Your Roll', value: `${roll.toFixed(1)}`, inline: true },
						{ name: '💰 Coins Remaining', value: `${userData.bonkCoins}`, inline: true }
					)
					.setColor('#00FF00')
					.setTimestamp();

				await interaction.reply({ embeds: [embed] });
			} else {
				// Failed escape
				interaction.client.saveData();

				const embed = new EmbedBuilder()
					.setTitle('🔒 Lock Picking FAILED!')
					.setDescription(`**${interaction.user.displayName}** spent **${coinsToSpend} coins** but failed to pick the lock!\n\n😔 **Still in jail...** The guards heard you fumbling with the lock!`)
					.addFields(
						{ name: '🎲 Success Chance', value: `${successChance.toFixed(1)}%`, inline: true },
						{ name: '🎯 Your Roll', value: `${roll.toFixed(1)}`, inline: true },
						{ name: '💰 Coins Remaining', value: `${userData.bonkCoins}`, inline: true }
					)
					.setColor('#FF0000')
					.setTimestamp();

				await interaction.reply({ embeds: [embed] });
			}

		} else if (subcommand === 'jailbreak') {
			const prisoner = interaction.options.getUser('prisoner');
			const coinsToContribute = interaction.options.getInteger('coins');
			const prisonerData = interaction.client.getUserData(prisoner.id);

			// Check if target is actually in jail
			if (!prisonerData.isInJail) {
				return await interaction.reply({ 
					content: `🔓 ${prisoner.displayName} is not in jail! No jailbreak needed.`, 
					ephemeral: true 
				});
			}

			// Check if user has enough coins
			if (userData.bonkCoins < coinsToContribute) {
				return await interaction.reply({ 
					content: `🚫 You don't have enough coins! You have ${userData.bonkCoins} coins but need ${coinsToContribute}.`, 
					ephemeral: true 
				});
			}

			// Can't jailbreak yourself
			if (prisoner.id === interaction.user.id) {
				return await interaction.reply({ 
					content: '🚫 You can\'t organize a jailbreak for yourself! Use `/bonkescape lockpick` instead.', 
					ephemeral: true 
				});
			}

			// Initialize jailbreak data if it doesn't exist
			if (!prisonerData.jailbreakFund) {
				prisonerData.jailbreakFund = 0;
				prisonerData.jailbreakContributors = [];
			}

			// Check if user already contributed
			const alreadyContributed = prisonerData.jailbreakContributors.find(c => c.userId === interaction.user.id);
			if (alreadyContributed) {
				return await interaction.reply({ 
					content: `🚫 You've already contributed ${alreadyContributed.amount} coins to ${prisoner.displayName}'s jailbreak!`, 
					ephemeral: true 
				});
			}

			// Deduct coins and add to jailbreak fund
			userData.bonkCoins -= coinsToContribute;
			prisonerData.jailbreakFund += coinsToContribute;
			prisonerData.jailbreakContributors.push({
				userId: interaction.user.id,
				username: interaction.user.displayName,
				amount: coinsToContribute
			});

			// Calculate if jailbreak is successful (need 100+ coins total)
			const requiredFund = 100;
			const jailbreakSuccess = prisonerData.jailbreakFund >= requiredFund;

			if (jailbreakSuccess) {
				// Successful jailbreak!
				prisonerData.isInJail = false;
				prisonerData.jailEndTime = null;
				
				// Find prisoner in guild and restore roles
				const prisonerMember = interaction.guild.members.cache.get(prisoner.id);
				if (prisonerMember) {
					const jailRoleName = interaction.client.config.jailSettings?.roleName || 'Horny Jail';
					const jailRole = interaction.guild.roles.cache.find(role => role.name === jailRoleName);
					
					// Always restore original roles if they exist, regardless of jail role status
					if (prisonerData.originalRoles && prisonerData.originalRoles.length > 0) {
						await prisonerMember.roles.set(prisonerData.originalRoles, 'Jailbreak escape - restoring original roles');
					} else if (jailRole && prisonerMember.roles.cache.has(jailRole.id)) {
						// Only remove jail role if no original roles to restore
						await prisonerMember.roles.remove(jailRole.id, 'Jailbreak escape');
					}
					
					// Delete jail channel
					if (prisonerData.jailChannelId) {
						const jailChannel = interaction.guild.channels.cache.get(prisonerData.jailChannelId);
						if (jailChannel) {
							const contributorNames = prisonerData.jailbreakContributors.map(c => c.username).join(', ');
							await jailChannel.send(`🚨 **JAILBREAK SUCCESSFUL!** 🚨\n\n${prisoner} has been broken out by: **${contributorNames}**!\n\nThis channel will be deleted in 10 seconds. Viva la revolución! ✊`);
							const channelIdToDelete = prisonerData.jailChannelId;
							delete prisonerData.jailChannelId;
							
							setTimeout(async () => {
								try {
									const channelToDelete = interaction.guild.channels.cache.get(channelIdToDelete);
									if (channelToDelete) {
										await channelToDelete.delete('User escaped via jailbreak');
									}
								} catch (error) {
									console.error('Error deleting jail channel:', error);
								}
							}, 10000);
						} else {
							delete prisonerData.jailChannelId;
						}
					}
				}
				
				// Clean up data
				delete prisonerData.originalRoles;
				delete prisonerData.originalRolesDebug;
				
				// Store values before cleanup to prevent race conditions
				const jailbreakData = {
					finalFund: prisonerData.jailbreakFund || 0,
					contributorCount: prisonerData.jailbreakContributors ? prisonerData.jailbreakContributors.length : 0
				};
				
				// Clear the data immediately after storing
				delete prisonerData.jailbreakFund;
				delete prisonerData.jailbreakContributors;
				
				interaction.client.saveData();

				const embed = new EmbedBuilder()
					.setTitle('🚨 JAILBREAK SUCCESSFUL! 🚨')
					.setDescription(`**${prisoner.displayName}** has been broken out of jail!\n\n✊ **VIVA LA REVOLUCIÓN!** ✊`)
					.addFields(
						{ name: '💰 Total Fund Raised', value: `${jailbreakData.finalFund} coins`, inline: true },
						{ name: '👥 Contributors', value: `${jailbreakData.contributorCount} heroes`, inline: true },
						{ name: '🎯 Your Contribution', value: `${coinsToContribute} coins`, inline: true }
					)
					.setColor('#FFD700')
					.setTimestamp();

				await interaction.reply({ embeds: [embed] });
			} else {
				// Jailbreak in progress
				interaction.client.saveData();

				const remaining = requiredFund - prisonerData.jailbreakFund;
				const embed = new EmbedBuilder()
					.setTitle('🤝 Jailbreak Contribution Added!')
					.setDescription(`**${interaction.user.displayName}** contributed **${coinsToContribute} coins** to ${prisoner.displayName}'s jailbreak fund!\n\n💪 The escape plan is forming...`)
					.addFields(
						{ name: '💰 Current Fund', value: `${prisonerData.jailbreakFund}/${requiredFund} coins`, inline: true },
						{ name: '🎯 Still Needed', value: `${remaining} coins`, inline: true },
						{ name: '👥 Contributors', value: `${prisonerData.jailbreakContributors.length}`, inline: true }
					)
					.setColor('#FFA500')
					.setTimestamp();

				await interaction.reply({ embeds: [embed] });
			}

		} else if (subcommand === 'behavior') {
			// Check if user is in jail
			if (!userData.isInJail) {
				return await interaction.reply({ 
					content: '📖 You\'re not in jail, so no behavior to track!', 
					ephemeral: true 
				});
			}

			// Initialize good behavior tracking
			if (!userData.goodBehavior) {
				userData.goodBehavior = {
					messagesInJail: 0,
					timeReduction: 0,
					lastMessage: null
				};
			}

			// Calculate time reduction (every 10 messages = 2 minutes off)
			const completedCycles = Math.floor(userData.goodBehavior.messagesInJail / 10);
			const timeReductionMinutes = completedCycles * 2;
			
			// Ensure we don't display negative values
			const safeTimeReduction = Math.max(0, timeReductionMinutes);
			const timeReductionMs = timeReductionMinutes * 60 * 1000;

			const embed = new EmbedBuilder()
				.setTitle('📖 Good Behavior Report')
				.setDescription(`**${interaction.user.displayName}**'s behavior while in jail:`)
				.addFields(
					{ name: '💬 Messages in Jail', value: `${userData.goodBehavior.messagesInJail}`, inline: true },
					{ name: '⏰ Time Reduction Earned', value: `${safeTimeReduction} minutes`, inline: true },
					{ name: '📊 Behavior Rating', value: getBehaviorRating(userData.goodBehavior.messagesInJail), inline: true }
				)
				.setColor('#4169E1')
				.setFooter({ text: 'Keep chatting in your jail channel to earn more time reduction!' })
				.setTimestamp();

			await interaction.reply({ embeds: [embed], ephemeral: true });
		}
	},
};

function getBehaviorRating(messageCount) {
	if (messageCount >= 50) return '😇 Angelic';
	if (messageCount >= 30) return '👼 Very Good';
	if (messageCount >= 20) return '😊 Good';
	if (messageCount >= 10) return '🙂 Fair';
	if (messageCount >= 5) return '😐 Poor';
	return '😈 Troublemaker';
}
