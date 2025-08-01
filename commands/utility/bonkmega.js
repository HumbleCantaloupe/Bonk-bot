/**
 * @file bonkmega.js
 * @description Mega bonk command - sends users to jail for 15 minutes with enhanced effects
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 2.1.0
 * 
 * @changelog
 * - 2.1.0 (2024-08-01): Added shop power-up integration, admin protection, extended jail time
 * - 2.0.0 (2024-07-31): Implemented individual jail channels, deferred replies for stability
 * - 1.5.0 (2024-07-31): Added bonk roulette event system, improved error handling
 * - 1.0.0 (2024-07-31): Initial implementation with basic mega bonk functionality
 * 
 * @dependencies discord.js
 * @permissions ManageChannels, ManageRoles, SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkmega')
		.setDescription('Mega bonk a user and send them to horny jail for 15 minutes!')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The user to mega bonk')
				.setRequired(true)),
	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const bonker = interaction.user;
		
		// Nobody likes a self-bonker
		if (target.id === bonker.id) {
			return await interaction.reply({ 
				content: '🚫 You cannot mega bonk yourself!', 
				ephemeral: true 
			});
		}

		// Bots are immune to our shenanigans
		if (target.bot) {
			return await interaction.reply({ 
				content: '🚫 You cannot mega bonk bots!', 
				ephemeral: true 
			});
		}

		// Check the special immunity list first
		if (interaction.client.specialEvents.bonkImmunityUsers.includes(target.id)) {
			return await interaction.reply({ 
				content: `🛡️ ${target.displayName} has bonk immunity and cannot be mega bonked!`, 
				ephemeral: true 
			});
		}

		// Make sure the bonker has enough coins for this expensive operation
		const bonkerData = interaction.client.getUserData(bonker.id);
		
		// Mega bonks ain't cheap - need 2 coins minimum
		if (bonkerData.bonkCoins < 2) {
			return await interaction.reply({ 
				content: '🚫 You need at least 2 bonk coins for a mega bonk! Claim daily coins with `/bonkclaim`.', 
				ephemeral: true 
			});
		}

		// Fetch the target to check their server permissions
		const targetMember = await interaction.guild.members.fetch(target.id);
		
		// Admins and mods are protected from the chaos
		if (targetMember.permissions.has(['Administrator']) || 
		    targetMember.permissions.has(['ManageGuild']) || 
		    targetMember.permissions.has(['ManageRoles'])) {
			return await interaction.reply({ 
				content: `🛡️ ${target.displayName} has administrative permissions and cannot be bonked!`,
				ephemeral: true 
			});
		}
		
		// Can't double-jail someone already serving time
		const targetData = interaction.client.getUserData(target.id);
		if (targetData.isInJail) {
			return await interaction.reply({ 
				content: `🚫 ${target.displayName} is already in horny jail!`, 
				ephemeral: true 
			});
		}

		// Check if they bought immunity from the shop
		if (targetData.activeEffects && targetData.activeEffects.immunityUntil && Date.now() < targetData.activeEffects.immunityUntil) {
			return await interaction.reply({ 
				content: `🌟 ${target.displayName} has immunity active and cannot be bonked!`,
				ephemeral: true 
			});
		}

		// Shield power-up blocks one bonk attempt
		if (targetData.activeEffects && targetData.activeEffects.shieldActive) {
			targetData.activeEffects.shieldActive = false; // Shield gets consumed
			interaction.client.saveData();
			return await interaction.reply({ 
				content: `🛡️ ${target.displayName}'s shield blocked your mega bonk! The shield has been consumed.`,
				ephemeral: true 
			});
		}

		// Bonk roulette event
		if (interaction.client.specialEvents.bonkRoulette && Math.random() < 0.2) {
			// 20% chance to bonk yourself instead!
			const bonkerMember = await interaction.guild.members.fetch(bonker.id);
			if (!interaction.client.getUserData(bonker.id).isInJail) {
				// Apply jail to bonker instead
				const jailRole = interaction.guild.roles.cache.find(role => role.name === 'Horny Jail');
				if (jailRole) {
					bonkerData.isInJail = true;
					bonkerData.jailEndTime = Date.now() + (5 * 60 * 1000); // 5 minutes for self-bonk
					await bonkerMember.roles.set([jailRole.id], 'Bonk roulette backfire!');
				}
			}
			
			bonkerData.bonkCoins -= 2;
			interaction.client.saveData();
			
			return await interaction.reply({
				content: `🎲 **BONK ROULETTE!** 🎲\n💥 The mega bonk backfired! ${bonker} bonked themselves instead! 💥`,
				ephemeral: false
			});
		}

		// Find or create horny jail role and channel (same logic as regular bonk)
		let jailRole = interaction.guild.roles.cache.find(role => role.name === 'Horny Jail');
		if (!jailRole) {
			try {
				jailRole = await interaction.guild.roles.create({
					name: 'Horny Jail',
					color: '#FF69B4',
					reason: 'Role for users in horny jail'
				});
			} catch (error) {
				return await interaction.reply({ 
					content: '❌ I don\'t have permission to create roles!', 
					ephemeral: true 
				});
			}
		}

		// Create individual horny jail channel for this user
		const jailChannelName = `horny-jail-${targetUser.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${targetUser.discriminator || Math.floor(Math.random() * 10000)}`;
		let jailChannel;
		try {
			jailChannel = await interaction.guild.channels.create({
				name: jailChannelName,
				type: 0,
				topic: `🔒 ${targetUser.displayName}'s personal horny jail! You'll be released in 15 minutes.`,
				permissionOverwrites: [
					{
						id: targetUser.id,
						allow: ['ViewChannel', 'SendMessages', 'AddReactions'],
						deny: ['CreatePublicThreads', 'CreatePrivateThreads']
					},
					{
						id: interaction.guild.roles.everyone.id,
						allow: ['ViewChannel', 'SendMessages', 'AddReactions'], // Everyone can see and talk
						deny: ['CreatePublicThreads', 'CreatePrivateThreads']
					}
				]
			});
		} catch (error) {
			return await interaction.reply({ 
				content: '❌ I don\'t have permission to create channels!', 
				ephemeral: true 
			});
		}

		// Store user's original roles
		const originalRoles = targetMember.roles.cache
			.filter(role => role.id !== interaction.guild.roles.everyone.id)
			.map(role => role.id);
		
		targetData.originalRoles = originalRoles;

		// Remove all roles and add jail role
		try {
			await targetMember.roles.set([jailRole.id], `Mega bonked by ${bonker.tag} - Sent to horny jail`);
		} catch (error) {
			return await interaction.reply({ 
				content: '❌ I don\'t have permission to manage this user\'s roles!', 
				ephemeral: true 
			});
		}

		// Update channel permissions
		try {
			const channels = interaction.guild.channels.cache.filter(channel => 
				channel.type === 0 && channel.id !== jailChannel.id
			);
			
			for (const [channelId, channel] of channels) {
				await channel.permissionOverwrites.edit(jailRole, {
					SendMessages: false,
					CreatePublicThreads: false,
					CreatePrivateThreads: false,
					AddReactions: true
				});
			}
		} catch (error) {
			console.error('Error updating channel permissions:', error);
		}

		// Update statistics
		bonkerData.totalBonksGiven++;
		targetData.totalBonksReceived++;
		
		// Update streak
		const today = new Date().toDateString();
		if (bonkerData.lastBonkDate === today) {
			bonkerData.bonkStreak++;
		} else {
			bonkerData.bonkStreak = 1;
		}
		bonkerData.lastBonkDate = today;

		// Deduct bonk coins (mega bonk costs 2)
		bonkerData.bonkCoins -= 2;
		
		// Set jail status (15 minutes for mega bonk)
		const jailTime = 15 * 60 * 1000;
		targetData.isInJail = true;
		targetData.jailEndTime = Date.now() + jailTime;
		targetData.jailChannelId = jailChannel.id; // Store channel ID for cleanup
		
		// Update longest jail time
		if (jailTime > targetData.longestJailTime) {
			targetData.longestJailTime = jailTime;
		}

		// Save data
		interaction.client.saveData();

		// Create mega bonk embed
		const bonkEmbed = new EmbedBuilder()
			.setTitle('💥 MEGA BONK! 💥')
			.setDescription(`${target} has been **MEGA BONKED** by ${bonker}!`)
			.addFields(
				{ name: '⚡ Sentence', value: 'Sent to horny jail for **15 MINUTES**!', inline: true },
				{ name: '🪙 Remaining Coins', value: `${bonkerData.bonkCoins}`, inline: true },
				{ name: '🔥 Bonk Streak', value: `${bonkerData.bonkStreak}`, inline: true }
			)
			.setColor('#FF0000')
			.setImage('https://c.tenor.com/DuN47QciYfsAAAAC/tenor.gif')
			.setTimestamp();

		await interaction.reply({ embeds: [bonkEmbed] });

		// Send follow-up
		setTimeout(async () => {
			try {
				await interaction.followUp({
					content: `💥 ${target} has been **MEGA BONKED** and sent to ${jailChannel}! They're in for **15 MINUTES** of hard time! 💥`,
					ephemeral: false
				});
			} catch (error) {
				console.error('Error sending follow-up:', error);
			}
		}, 1000);
	},
};
