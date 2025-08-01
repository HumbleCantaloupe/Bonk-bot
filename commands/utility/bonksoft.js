/**
 * @file bonksoft.js
 * @description Gentle bonk command - a lighter touch for minor infractions
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.8.0
 * 
 * @changelog
 * - 1.8.0 (2024-08-01): Added shop power-up integration, admin protection, 5min jail time
 * - 1.7.0 (2024-07-31): Implemented individual jail channels for soft bonks
 * - 1.6.0 (2024-07-31): Added pink theme and gentler messaging
 * - 1.5.0 (2024-07-31): Introduced soft bonk as alternative to regular bonk
 * - 1.0.0 (2024-07-31): Initial soft bonk implementation
 * 
 * @dependencies discord.js
 * @permissions ManageChannels, ManageRoles, SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonksoft')
		.setDescription('Soft bonk a user with a gentle 2-minute timeout')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The user to soft bonk')
				.setRequired(true)),
	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const bonker = interaction.user;
		
		// Don't allow self-bonking
		if (target.id === bonker.id) {
			return await interaction.reply({ 
				content: '🚫 You cannot soft bonk yourself!', 
				ephemeral: true 
			});
		}

		// Don't allow bonking bots
		if (target.bot) {
			return await interaction.reply({ 
				content: '🚫 You cannot soft bonk bots!', 
				ephemeral: true 
			});
		}

		// Get bonker's data
		const bonkerData = interaction.client.getUserData(bonker.id);
		
		// Check if bonker has coins
		if (bonkerData.bonkCoins <= 0) {
			return await interaction.reply({ 
				content: '🚫 You have no bonk coins left! Claim daily coins with `/bonkclaim`.', 
				ephemeral: true 
			});
		}

		// Get target member
		const targetMember = await interaction.guild.members.fetch(target.id);
		
		// Check if target is server owner or has admin permissions
		if (targetMember.permissions.has(['Administrator']) || targetMember.id === interaction.guild.ownerId) {
			return await interaction.reply({ 
				content: `🛡️ ${target.displayName} has administrator permissions or is the server owner and cannot be bonked!`,
				ephemeral: true 
			});
		}
		
		// Check if target has active immunity
		const targetData = interaction.client.getUserData(target.id);
		if (targetData.activeEffects && targetData.activeEffects.immunity && targetData.activeEffects.immunity > Date.now()) {
			return await interaction.reply({ 
				content: `🛡️ ${target.displayName} has active immunity and cannot be bonked!`,
				ephemeral: true 
			});
		}

		// Check if target has shield power-up and consume it
		if (targetData.activeEffects && targetData.activeEffects.shieldActive) {
			targetData.activeEffects.shieldActive = false;
			interaction.client.saveData();
			return await interaction.reply({ 
				content: `🛡️ ${target.displayName}'s shield blocked the soft bonk! The shield has been consumed.`,
				ephemeral: true 
			});
		}

		// Reflect power-up bounces the bonk back
		if (targetData.activeEffects && targetData.activeEffects.reflectActive) {
			targetData.activeEffects.reflectActive = false;
			
			// The soft bonk bounces back to the bonker
			if (!bonkerData.isInJail) {
				const bonkerMember = await interaction.guild.members.fetch(bonker.id);
				const jailRole = interaction.guild.roles.cache.find(role => role.name === 'Horny Jail');
				
				if (jailRole) {
					bonkerData.isInJail = true;
					bonkerData.jailEndTime = Date.now() + ((interaction.client.config.jailSettings?.jailTimes?.soft || 5) * 60 * 1000);
					await bonkerMember.roles.set([jailRole.id], 'Soft bonk reflected back!');
				}
			}
			
			bonkerData.bonkCoins--; // Soft bonk costs 1 coin
			targetData.totalBonksReceived++; // They still "received" the bonk technically
			bonkerData.totalBonksGiven++; // But it backfired
			interaction.client.saveData();
			
			return await interaction.reply({ 
				content: `🪞 **SOFT BONK REFLECTED!** 🪞\n${target.displayName}'s mirror deflected the soft bonk back at ${bonker}! Gentle justice served!`,
				ephemeral: false
			});
		}
		
		// Check if target is already in jail
		if (targetData.isInJail) {
			return await interaction.reply({ 
				content: `🚫 ${target.displayName} is already in horny jail!`, 
				ephemeral: true 
			});
		}

		// Find or create horny jail role and channel
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
		const jailChannelName = `horny-jail-${target.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${target.discriminator || Math.floor(Math.random() * 10000)}`;
		let jailChannel;
		try {
			jailChannel = await interaction.guild.channels.create({
				name: jailChannelName,
				type: 0,
				topic: `🔒 ${target.displayName}'s personal horny jail! You'll be released in 5 minutes.`,
				permissionOverwrites: [
					{
						id: target.id,
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
			await targetMember.roles.set([jailRole.id], `Soft bonked by ${bonker.tag} - Sent to horny jail`);
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

		// Deduct bonk credit
		bonkerData.bonkCoins--;
		
		// Set jail status (5 minutes for soft bonk)
		const jailTime = (interaction.client.config.jailSettings?.jailTimes?.soft || 5) * 60 * 1000;
		targetData.isInJail = true;
		targetData.jailEndTime = Date.now() + jailTime;
		targetData.jailChannelId = jailChannel.id; // Store channel ID for cleanup

		// Save data
		interaction.client.saveData();

		// Create soft bonk embed
		const bonkEmbed = new EmbedBuilder()
			.setTitle('🥺 Soft Bonk 🥺')
			.setDescription(`${target} has been gently bonked by ${bonker}`)
			.addFields(
				{ name: '💖 Gentle Sentence', value: 'Sent to horny jail for 5 minutes', inline: true },
				{ name: '🪙 Remaining Coins', value: `${bonkerData.bonkCoins}`, inline: true }
			)
			.setColor('#FFB6C1')
			.setImage('https://c.tenor.com/DuN47QciYfsAAAAC/tenor.gif')
			.setTimestamp();

		await interaction.reply({ embeds: [bonkEmbed] });

		// Send follow-up
		setTimeout(async () => {
			try {
				await interaction.followUp({
					content: `🥺 ${target} has been gently sent to ${jailChannel} for a short 2-minute timeout. Be nice! 💕`,
					ephemeral: false
				});
			} catch (error) {
				console.error('Error sending follow-up:', error);
			}
		}, 1000);
	},
};
