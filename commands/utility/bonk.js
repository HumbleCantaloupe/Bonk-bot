/**
 * @file bonk.js
 * @description Standard bonk command - core functionality for sending users to jail
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 2.3.0
 * 
 * @changelog
 * - 2.3.0 (2024-08-01): Enhanced with shop power-ups, admin protection, 10min jail time
 * - 2.2.0 (2024-08-01): Added deferred replies to prevent interaction timeouts
 * - 2.1.0 (2024-07-31): Implemented individual jail channels with public visibility
 * - 2.0.0 (2024-07-31): Switched to coin-based economy from credits
 * - 1.5.0 (2024-07-31): Added statistics tracking and streak system
 * - 1.0.0 (2024-07-31): Initial bonk command with basic jail functionality
 * 
 * @dependencies discord.js
 * @permissions ManageChannels, ManageRoles, SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonk')
		.setDescription('Bonk a user and send them to horny jail!')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The user to bonk')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		
		const target = interaction.options.getUser('target');
		const bonker = interaction.user;
		
		if (target.id === bonker.id) {
			return await interaction.editReply({ 
				content: interaction.client.config.messages?.errorMessages?.cannotBonkSelf || '🚫 You cannot bonk yourself!',
			});
		}

		if (target.bot) {
			return await interaction.editReply({ 
				content: interaction.client.config.messages?.errorMessages?.cannotBonkBot || '🚫 You cannot bonk bots!',
			});
		}

		const bonkerData = interaction.client.getUserData(bonker.id);
		
		if (bonkerData.bonkCoins <= 0) {
			return await interaction.editReply({ 
				content: interaction.client.config.messages?.errorMessages?.insufficientCoins || '🚫 You don\'t have enough bonk coins!',
			});
		}

		const targetMember = await interaction.guild.members.fetch(target.id);
		const targetData = interaction.client.getUserData(target.id);
		
		// Check for admin immunity
		if (interaction.client.specialEvents.bonkImmunityUsers.includes(target.id)) {
			return await interaction.editReply({ 
				content: `🛡️ ${target.displayName} has admin bonk immunity and cannot be bonked!`,
			});
		}

		// Can't bonk server owner or admins
		if (targetMember.permissions.has(['Administrator']) || targetMember.id === interaction.guild.ownerId) {
			return await interaction.editReply({ 
				content: `🛡️ ${target.displayName} has administrator permissions or is the server owner and cannot be bonked!`,
			});
		}

		// Check shop immunity
		if (targetData.activeEffects && targetData.activeEffects.immunityUntil && Date.now() < targetData.activeEffects.immunityUntil) {
			return await interaction.editReply({ 
				content: `🌟 ${target.displayName} has immunity active and cannot be bonked!`,
			});
		}

		// Check for shield
		if (targetData.activeEffects && targetData.activeEffects.shieldActive) {
			targetData.activeEffects.shieldActive = false;
			interaction.client.saveData();
			return await interaction.editReply({ 
				content: `🛡️ ${target.displayName}'s shield blocked your bonk! The shield has been consumed.`,
			});
		}

		// Check for reflect
		if (targetData.activeEffects && targetData.activeEffects.reflectActive) {
			targetData.activeEffects.reflectActive = false;
			
			// The bonk bounces back to the bonker
			if (!bonkerData.isInJail) {
				const bonkerMember = await interaction.guild.members.fetch(bonker.id);
				const jailRole = interaction.guild.roles.cache.find(role => role.name === interaction.client.config.jailSettings?.roleName || 'Horny Jail');
				
				if (jailRole) {
					// Save bonker's original roles before jailing them
					const bonkerOriginalRoles = bonkerMember.roles.cache
						.filter(role => role.id !== interaction.guild.roles.everyone.id)
						.map(role => role.id);
					
					const bonkerOriginalRolesDebug = bonkerMember.roles.cache
						.filter(role => role.id !== interaction.guild.roles.everyone.id)
						.map(role => ({ id: role.id, name: role.name }));
					
					bonkerData.originalRoles = bonkerOriginalRoles;
					bonkerData.originalRolesDebug = bonkerOriginalRolesDebug; // For debugging
					
					console.log(`[REFLECT] Saving ${bonkerOriginalRoles.length} original roles for ${bonkerMember.user.tag}:`, bonkerOriginalRoles);
					console.log(`[REFLECT] Role details:`, bonkerOriginalRolesDebug);
					
					bonkerData.isInJail = true;
					bonkerData.jailEndTime = Date.now() + ((interaction.client.config.jailSettings?.jailTimes?.soft || 5) * 60 * 1000);
					await bonkerMember.roles.set([jailRole.id], 'Bonk reflected back!');
				}
			}
			
			bonkerData.bonkCoins--;
			targetData.totalBonksReceived++; // They still "received" the bonk technically
			bonkerData.totalBonksGiven++; // But it backfired
			interaction.client.saveData();
			
			return await interaction.editReply({ 
				content: `🪞 **BONK REFLECTED!** 🪞\n${target.displayName}'s mirror deflected the bonk back at ${bonker}! The bonker has been jailed instead!`,
			});
		}

		if (targetData.isInJail) {
			return await interaction.editReply({ 
				content: interaction.client.config.messages?.errorMessages?.alreadyInJail || `🚫 ${target.displayName} is already in horny jail!`,
			});
		}

		// Bonk roulette sometimes backfires
		if (interaction.client.specialEvents.bonkRoulette && Math.random() < 0.15) {
			const bonkerMember = await interaction.guild.members.fetch(bonker.id);
			if (!bonkerData.isInJail) {
				const jailRole = interaction.guild.roles.cache.find(role => role.name === interaction.client.config.jailSettings?.roleName || 'Horny Jail');
				if (jailRole) {
					// Save bonker's original roles before jailing them
					const bonkerOriginalRoles = bonkerMember.roles.cache
						.filter(role => role.id !== interaction.guild.roles.everyone.id)
						.map(role => role.id);
					
					const bonkerOriginalRolesDebug = bonkerMember.roles.cache
						.filter(role => role.id !== interaction.guild.roles.everyone.id)
						.map(role => ({ id: role.id, name: role.name }));
					
					bonkerData.originalRoles = bonkerOriginalRoles;
					bonkerData.originalRolesDebug = bonkerOriginalRolesDebug; // For debugging
					
					console.log(`[ROULETTE] Saving ${bonkerOriginalRoles.length} original roles for ${bonkerMember.user.tag}:`, bonkerOriginalRoles);
					console.log(`[ROULETTE] Role details:`, bonkerOriginalRolesDebug);
					
					bonkerData.isInJail = true;
					bonkerData.jailEndTime = Date.now() + ((interaction.client.config.jailSettings?.jailTimes?.soft || 5) * 60 * 1000);
					await bonkerMember.roles.set([jailRole.id], 'Bonk roulette backfire!');
				}
			}
			
			bonkerData.bonkCoins--;
			interaction.client.saveData();
			
			return await interaction.editReply({
				content: `🎲 **BONK ROULETTE!** 🎲\n💥 The bonk backfired! ${bonker} bonked themselves instead! 💥`,
			});
		}

		// Find or create jail role
		const jailRoleName = interaction.client.config.jailSettings?.roleName || 'Horny Jail';
		let jailRole = interaction.guild.roles.cache.find(role => role.name === jailRoleName);
		if (!jailRole) {
			try {
				jailRole = await interaction.guild.roles.create({
					name: jailRoleName,
					color: interaction.client.config.jailSettings?.roleColor || '#FF69B4',
					reason: 'Role for users in horny jail'
				});
				console.log('Created Horny Jail role');
			} catch (error) {
				console.error('Error creating role:', error);
				return await interaction.editReply({ 
					content: '❌ I don\'t have permission to create roles!',
				});
			}
		}

		// Create their personal jail channel
		const jailChannelName = `${interaction.client.config.jailSettings?.channelPrefix || 'horny-jail-'}${target.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${target.discriminator || Math.floor(Math.random() * 10000)}`;
		const configJailMinutes = interaction.client.config.jailSettings?.jailTimes?.regular || 10;
		let jailChannel;
		try {
			jailChannel = await interaction.guild.channels.create({
				name: jailChannelName,
				type: 0, // Text channel
				topic: `🔒 ${target.displayName}'s personal horny jail! You'll be released in ${configJailMinutes} minutes.`,
				permissionOverwrites: [
					{
						id: target.id,
						allow: ['ViewChannel', 'SendMessages', 'AddReactions'],
						deny: ['CreatePublicThreads', 'CreatePrivateThreads']
					},
					{
						id: interaction.guild.roles.everyone.id,
						allow: ['ViewChannel', 'SendMessages', 'AddReactions'],
						deny: ['CreatePublicThreads', 'CreatePrivateThreads']
					}
				]
			});
			console.log(`Created individual horny jail channel: ${jailChannelName}`);
		} catch (error) {
			console.error('Error creating channel:', error);
			return await interaction.editReply({ 
				content: '❌ I don\'t have permission to create channels!',
			});
		}

		// Save their original roles with detailed info for debugging
		const originalRoles = targetMember.roles.cache
			.filter(role => role.id !== interaction.guild.roles.everyone.id)
			.map(role => role.id);
		
		const originalRolesDebug = targetMember.roles.cache
			.filter(role => role.id !== interaction.guild.roles.everyone.id)
			.map(role => ({ id: role.id, name: role.name }));
		
		targetData.originalRoles = originalRoles;
		targetData.originalRolesDebug = originalRolesDebug; // For debugging
		
		console.log(`Saving ${originalRoles.length} original roles for ${targetMember.user.tag}:`, originalRoles);
		console.log(`Role details:`, originalRolesDebug);

		// Jail them
		try {
			await targetMember.roles.set([jailRole.id], `Bonked by ${bonker.tag} - Sent to horny jail`);
		} catch (error) {
			console.error('Error setting roles:', error);
			return await interaction.editReply({ 
				content: '❌ I don\'t have permission to manage this user\'s roles!',
			});
		}

		// Block them from posting in other channels
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

		// Update stats
		bonkerData.totalBonksGiven++;
		targetData.totalBonksReceived++;
		
		// Streak tracking
		const today = new Date().toDateString();
		if (bonkerData.lastBonkDate === today) {
			bonkerData.bonkStreak++;
		} else {
			bonkerData.bonkStreak = 1;
		}
		bonkerData.lastBonkDate = today;

		bonkerData.bonkCoins--;
		
		targetData.isInJail = true;
		let jailTime = (interaction.client.config.jailSettings?.jailTimes?.regular || 10) * 60 * 1000;
		
		// Power-up effects
		if (bonkerData.activeEffects && bonkerData.activeEffects.bonkBoostActive) {
			jailTime *= 2;
			bonkerData.activeEffects.bonkBoostActive = false;
		}
		
		if (targetData.activeEffects && targetData.activeEffects.reducedSentenceActive) {
			jailTime = Math.floor(jailTime / 2);
			targetData.activeEffects.reducedSentenceActive = false;
		}
		
		targetData.jailEndTime = Date.now() + jailTime;
		targetData.jailChannelId = jailChannel.id;
		
		if (jailTime > targetData.longestJailTime) {
			targetData.longestJailTime = jailTime;
		}

		interaction.client.saveData();

		// Create bonk embed
		const jailMinutes = Math.floor(jailTime / (60 * 1000));
		const jailMessages = interaction.client.config.messages?.jailMessages || ["has been bonked and sent to horny jail!"];
		const randomJailMessage = jailMessages[Math.floor(Math.random() * jailMessages.length)];
		
		const bonkEmbed = new EmbedBuilder()
			.setTitle('🔨 BONK! 🔨')
			.setDescription(`${target} ${randomJailMessage}`)
			.addFields(
				{ name: '🚨 Sentence', value: `Sent to horny jail for ${jailMinutes} minutes!`, inline: true },
				{ name: '🪙 Remaining Coins', value: `${bonkerData.bonkCoins}`, inline: true },
				{ name: '🔥 Bonk Streak', value: `${bonkerData.bonkStreak}`, inline: true }
			)
			.setColor('#FF69B4')
			.setImage('https://c.tenor.com/DuN47QciYfsAAAAC/tenor.gif')
			.setTimestamp();

		await interaction.editReply({ embeds: [bonkEmbed] });

		// Let everyone know
		setTimeout(async () => {
			try {
				await interaction.followUp({
					content: `🔒 ${target} has been sent to ${jailChannel}! They'll be released in ${jailMinutes} minutes.`,
					ephemeral: false
				});
			} catch (error) {
				console.error('Error sending follow-up:', error);
			}
		}, 1000);
	},
};
