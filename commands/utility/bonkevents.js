/**
 * @file bonkevents.js
 * @description Special events and seasonal features for enhanced gameplay
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.4.0
 * 
 * @changelog
 * - 1.4.0 (2024-08-01): Added shop-related events and power-up promotions
 * - 1.3.0 (2024-07-31): Implemented bonk roulette and double coin events
 * - 1.2.0 (2024-07-31): Added seasonal event calendar system
 * - 1.1.0 (2024-07-31): Enhanced event management and user notifications
 * - 1.0.0 (2024-07-31): Initial special events framework
 * 
 * @todo
 * - [ ] Add holiday-themed events
 * - [ ] Implement community event voting
 * - [ ] Add event participation rewards
 * - [ ] Consider adding guild-specific events
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks, ManageEvents
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkevents')
		.setDescription('Manage special bonk events')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('start')
				.setDescription('Start a special bonk event')
				.addStringOption(option =>
					option.setName('event')
						.setDescription('Type of event to start')
						.setRequired(true)
						.addChoices(
							{ name: 'Double Credit Weekend', value: 'double' },
							{ name: 'Bonk Roulette', value: 'roulette' },
							{ name: 'Reverse Bonk Day', value: 'reverse' }
						))
				.addIntegerOption(option =>
					option.setName('duration')
						.setDescription('Duration in hours (default: 24)')
						.setRequired(false)
						.setMinValue(1)
						.setMaxValue(168)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('stop')
				.setDescription('Stop all active events'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('status')
				.setDescription('Check current event status'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('immunity')
				.setDescription('Grant or remove bonk immunity')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('User to grant/remove immunity')
						.setRequired(true))
				.addBooleanOption(option =>
					option.setName('grant')
						.setDescription('Grant immunity (true) or remove it (false)')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('multiplier')
				.setDescription('Set credit multiplier for events')
				.addNumberOption(option =>
					option.setName('value')
						.setDescription('Credit multiplier (e.g., 2.0 for double credits)')
						.setRequired(true)
						.setMinValue(0.1)
						.setMaxValue(10.0))),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const specialEvents = interaction.client.specialEvents;

		if (subcommand === 'start') {
			const eventType = interaction.options.getString('event');
			const duration = interaction.options.getInteger('duration') || 24;
			const endTime = Date.now() + (duration * 60 * 60 * 1000);

			// Reset all events first
			specialEvents.doubleBonkWeekend = false;
			specialEvents.bonkRoulette = false;
			specialEvents.reverseBonkDay = false;

			let eventName = '';
			let eventDescription = '';

			switch (eventType) {
				case 'double':
					specialEvents.doubleBonkWeekend = true;
					eventName = 'Double Bonk Weekend';
					eventDescription = 'Everyone gets **6 bonk credits** per day instead of 3!';
					break;
				case 'roulette':
					specialEvents.bonkRoulette = true;
					eventName = 'Bonk Roulette';
					eventDescription = 'There\'s a **20% chance** mega bonks will backfire and bonk the bonker instead!';
					break;
				case 'reverse':
					specialEvents.reverseBonkDay = true;
					eventName = 'Reverse Bonk Day';
					eventDescription = 'Victims can immediately bonk back for **FREE** within 1 minute!';
					break;
			}

			specialEvents.eventEndTime = endTime;
			interaction.client.saveData();

			const embed = new EmbedBuilder()
				.setTitle('🎉 Special Event Started!')
				.setDescription(`**${eventName}** is now active!\n\n${eventDescription}`)
				.addFields({ 
					name: '⏰ Duration', 
					value: `${duration} hours`, 
					inline: true 
				})
				.setColor('#00FF00')
				.setTimestamp();

			await interaction.reply({ embeds: [embed], ephemeral: true });

		} else if (subcommand === 'stop') {
			specialEvents.doubleBonkWeekend = false;
			specialEvents.bonkRoulette = false;
			specialEvents.reverseBonkDay = false;
			specialEvents.eventMultiplier = 1;
			specialEvents.eventEndTime = null;
			interaction.client.saveData();

			await interaction.reply({ content: '🛑 All special events have been stopped.', ephemeral: true });

		} else if (subcommand === 'status') {
			const embed = new EmbedBuilder()
				.setTitle('📊 Current Event Status')
				.setColor('#4169E1')
				.setTimestamp();

			let activeEvents = [];
			if (specialEvents.doubleBonkWeekend) activeEvents.push('🎊 Double Bonk Weekend');
			if (specialEvents.bonkRoulette) activeEvents.push('🎲 Bonk Roulette');
			if (specialEvents.reverseBonkDay) activeEvents.push('🔄 Reverse Bonk Day');

			if (activeEvents.length === 0) {
				embed.setDescription('No special events are currently active.');
			} else {
				embed.setDescription(`**Active Events:**\n${activeEvents.join('\n')}`);
				
				if (specialEvents.eventEndTime) {
					const timeLeft = Math.max(0, specialEvents.eventEndTime - Date.now());
					const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
					embed.addFields({ 
						name: '⏰ Time Remaining', 
						value: `${hoursLeft} hour(s)`, 
						inline: true 
					});
				}
			}

			if (specialEvents.eventMultiplier !== 1) {
				embed.addFields({ 
					name: '✨ Credit Multiplier', 
					value: `${specialEvents.eventMultiplier}x`, 
					inline: true 
				});
			}

			if (specialEvents.bonkImmunityUsers.length > 0) {
				const immuneUsers = [];
				for (const userId of specialEvents.bonkImmunityUsers) {
					try {
						const user = await interaction.client.users.fetch(userId);
						immuneUsers.push(user.displayName);
					} catch (error) {
						// User not found
					}
				}
				if (immuneUsers.length > 0) {
					embed.addFields({ 
						name: '🛡️ Immune Users', 
						value: immuneUsers.join(', '), 
						inline: false 
					});
				}
			}

			await interaction.reply({ embeds: [embed], ephemeral: true });

		} else if (subcommand === 'immunity') {
			const user = interaction.options.getUser('user');
			const grant = interaction.options.getBoolean('grant');

			if (grant) {
				if (!specialEvents.bonkImmunityUsers.includes(user.id)) {
					specialEvents.bonkImmunityUsers.push(user.id);
					await interaction.reply({ content: `🛡️ Granted bonk immunity to ${user.displayName}!`, ephemeral: true });
				} else {
					await interaction.reply({ content: `${user.displayName} already has bonk immunity!`, ephemeral: true });
				}
			} else {
				const index = specialEvents.bonkImmunityUsers.indexOf(user.id);
				if (index > -1) {
					specialEvents.bonkImmunityUsers.splice(index, 1);
					await interaction.reply({ content: `🗡️ Removed bonk immunity from ${user.displayName}!`, ephemeral: true });
				} else {
					await interaction.reply({ content: `${user.displayName} doesn't have bonk immunity!`, ephemeral: true });
				}
			}
			
			interaction.client.saveData();

		} else if (subcommand === 'multiplier') {
			const value = interaction.options.getNumber('value');
			specialEvents.eventMultiplier = value;
			interaction.client.saveData();

			await interaction.reply({ content: `✨ Set credit multiplier to **${value}x**! Users will get ${Math.floor(3 * value)} credits per day.`, ephemeral: true });
		}
	},
};
