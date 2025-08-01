/**
 * @file bonkshop.js
 * @description Shop system for purchasing power-ups and special items with bonk coins
 * @author Marrow
 * @created 2024-08-01
 * @lastModified 2024-08-01
 * @version 1.0.0
 * 
 * @changelog
 * - 1.0.0 (2024-08-01): Initial shop implementation with 6 power-up items
 * 
 * @todo
 * - [ ] seasonal items for holidays would be cool
 * - [ ] make items expire so people can't hoard them forever
 * - [ ] gift items to friends, spread the chaos
 * - [ ] rare items that cost way too much but are awesome
 * - [ ] track what people buy so we know what's popular
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const shopItems = {
	shield: { name: 'Bonk Shield', price: 25, description: 'Blocks the next bonk attempt against you', emoji: '🛡️' },
	immunity: { name: '1-Hour Immunity', price: 50, description: 'Cannot be bonked for 1 hour', emoji: '🌟' },
	doubleCoin: { name: 'Double Coin Boost', price: 30, description: 'Earn double coins from claims for 24 hours', emoji: '💰' },
	reducedSentence: { name: 'Parole Pass', price: 40, description: 'Next jail sentence is reduced by 50%', emoji: '🗝️' },
	bonkBoost: { name: 'Bonk Power Boost', price: 35, description: 'Next bonk jails target for double time', emoji: '⚡' },
	lucky: { name: 'Lucky Charm', price: 45, description: 'Next gamble has +20% better odds', emoji: '🍀' },
	reflect: { name: 'Bonk Reflect', price: 55, description: 'Next bonk attempt against you bounces back to the attacker', emoji: '↩️' }
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkshop')
		.setDescription('Browse and buy power-ups with bonk coins')
		.addSubcommand(subcommand =>
			subcommand
				.setName('browse')
				.setDescription('Browse available items in the shop'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('buy')
				.setDescription('Buy an item from the shop')
				.addStringOption(option =>
					option.setName('item')
						.setDescription('Item to purchase')
						.setRequired(true)
						.addChoices(
							{ name: '🛡️ Bonk Shield (25 coins)', value: 'shield' },
							{ name: '🌟 1-Hour Immunity (50 coins)', value: 'immunity' },
							{ name: '💰 Double Coin Boost (30 coins)', value: 'doubleCoin' },
							{ name: '🗝️ Parole Pass (40 coins)', value: 'reducedSentence' },
							{ name: '⚡ Bonk Power Boost (35 coins)', value: 'bonkBoost' },
							{ name: '🍀 Lucky Charm (45 coins)', value: 'lucky' },
							{ name: '↩️ Bonk Reflect (55 coins)', value: 'reflect' }
						)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('inventory')
				.setDescription('Check your inventory and active effects'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('use')
				.setDescription('Use an item from your inventory')
				.addStringOption(option =>
					option.setName('item')
						.setDescription('Item to use')
						.setRequired(true)
						.addChoices(
							{ name: '🛡️ Bonk Shield', value: 'shield' },
							{ name: '🌟 1-Hour Immunity', value: 'immunity' },
							{ name: '💰 Double Coin Boost', value: 'doubleCoin' },
							{ name: '🗝️ Parole Pass', value: 'reducedSentence' },
							{ name: '⚡ Bonk Power Boost', value: 'bonkBoost' },
							{ name: '🍀 Lucky Charm', value: 'lucky' },
							{ name: '↩️ Bonk Reflect', value: 'reflect' }
						))),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const userData = interaction.client.getUserData(interaction.user.id);

		if (subcommand === 'browse') {
			const embed = new EmbedBuilder()
				.setTitle('🏪 Bonk Shop')
				.setDescription(`Welcome to the Bonk Shop! Use your coins to buy power-ups.\n💰 Your Balance: **${userData.bonkCoins} coins**`)
				.setColor('#FFD700')
				.setTimestamp();

			for (const [key, item] of Object.entries(shopItems)) {
				embed.addFields({
					name: `${item.emoji} ${item.name}`,
					value: `${item.description}\n💰 Price: **${item.price} coins**`,
					inline: true
				});
			}

			embed.setFooter({ text: 'Use /bonkshop buy <item> to purchase!' });
			await interaction.reply({ embeds: [embed] });

		} else if (subcommand === 'buy') {
			const itemKey = interaction.options.getString('item');
			const item = shopItems[itemKey];

			if (userData.bonkCoins < item.price) {
				return await interaction.reply({ 
					content: `💸 You don't have enough bonk coins! You need **${item.price}** coins but only have **${userData.bonkCoins}**.`, 
					ephemeral: true 
				});
			}

			// Initialize inventory if it doesn't exist
			if (!userData.inventory) {
				userData.inventory = {};
			}
			if (!userData.inventory[itemKey]) {
				userData.inventory[itemKey] = 0;
			}

			userData.bonkCoins -= item.price;
			userData.inventory[itemKey]++;
			interaction.client.saveData();

			const embed = new EmbedBuilder()
				.setTitle('✅ Purchase Successful!')
				.setDescription(`You bought **${item.emoji} ${item.name}** for **${item.price} coins**!`)
				.addFields(
					{ name: '💰 Remaining Balance', value: `${userData.bonkCoins} coins`, inline: true },
					{ name: '📦 Item Added', value: `${item.name} x1`, inline: true }
				)
				.setColor('#00FF00')
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });

		} else if (subcommand === 'inventory') {
			const embed = new EmbedBuilder()
				.setTitle('🎒 Your Inventory')
				.setDescription(`💰 Bonk Coins: **${userData.bonkCoins}**`)
				.setColor('#4169E1')
				.setTimestamp();

			// Show inventory items
			let inventoryText = '';
			if (userData.inventory) {
				for (const [key, quantity] of Object.entries(userData.inventory)) {
					if (quantity > 0 && shopItems[key]) {
						const item = shopItems[key];
						inventoryText += `${item.emoji} ${item.name} x${quantity}\n`;
					}
				}
			}

			if (inventoryText) {
				embed.addFields({ name: '📦 Items', value: inventoryText, inline: false });
			} else {
				embed.addFields({ name: '📦 Items', value: 'Your inventory is empty!', inline: false });
			}

			// Show active effects
			let activeEffectsText = '';
			if (userData.activeEffects) {
				const effects = userData.activeEffects;
				const now = Date.now();

				if (effects.shieldActive) {
					activeEffectsText += '🛡️ Shield Active - Next bonk blocked\n';
				}
				if (effects.immunityUntil && now < effects.immunityUntil) {
					const minutesLeft = Math.ceil((effects.immunityUntil - now) / (60 * 1000));
					activeEffectsText += `🌟 Immunity Active - ${minutesLeft} minutes left\n`;
				}
				if (effects.doubleCoinUntil && now < effects.doubleCoinUntil) {
					const hoursLeft = Math.ceil((effects.doubleCoinUntil - now) / (60 * 60 * 1000));
					activeEffectsText += `💰 Double Coins - ${hoursLeft} hours left\n`;
				}
				if (effects.reducedSentenceActive) {
					activeEffectsText += '🗝️ Parole Pass - Next sentence halved\n';
				}
				if (effects.bonkBoostActive) {
					activeEffectsText += '⚡ Bonk Boost - Next bonk doubled\n';
				}
				if (effects.luckyActive) {
					activeEffectsText += '🍀 Lucky Charm - Better gambling odds\n';
				}
			}

			if (activeEffectsText) {
				embed.addFields({ name: '✨ Active Effects', value: activeEffectsText, inline: false });
			}

			await interaction.reply({ embeds: [embed] });

		} else if (subcommand === 'use') {
			const itemKey = interaction.options.getString('item');
			const item = shopItems[itemKey];

			if (!userData.inventory || !userData.inventory[itemKey] || userData.inventory[itemKey] <= 0) {
				return await interaction.reply({ 
					content: `❌ You don't have any **${item.name}** in your inventory!`, 
					ephemeral: true 
				});
			}

			// Initialize activeEffects if it doesn't exist
			if (!userData.activeEffects) {
				userData.activeEffects = {};
			}

			// Handle different item effects
			let responseMessage = '';
			
			switch (itemKey) {
				case 'shield':
					userData.activeEffects.shieldActive = true;
					responseMessage = '🛡️ Shield activated! The next bonk attempt against you will be blocked.';
					break;

				case 'immunity':
					userData.activeEffects.immunityUntil = Date.now() + (60 * 60 * 1000); // 1 hour
					responseMessage = '🌟 1-hour immunity activated! You cannot be bonked for the next hour.';
					break;

				case 'doubleCoin':
					userData.activeEffects.doubleCoinUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
					responseMessage = '💰 Double Coin Boost activated! You\'ll earn double coins from claims for 24 hours.';
					break;

				case 'reducedSentence':
					userData.activeEffects.reducedSentenceActive = true;
					responseMessage = '🗝️ Parole Pass activated! Your next jail sentence will be reduced by 50%.';
					break;

				case 'bonkBoost':
					userData.activeEffects.bonkBoostActive = true;
					responseMessage = '⚡ Bonk Power Boost activated! Your next bonk will jail the target for double time.';
					break;

				case 'lucky':
					userData.activeEffects.luckyActive = true;
					responseMessage = '🍀 Lucky Charm activated! Your next gamble will have +20% better odds.';
					break;

				case 'reflect':
					userData.activeEffects.reflectActive = true;
					responseMessage = '↩️ Bonk Reflect activated! The next bonk attempt against you will bounce back to the attacker!';
					break;
			}

			userData.inventory[itemKey]--;
			interaction.client.saveData();

			const embed = new EmbedBuilder()
				.setTitle('✨ Item Used!')
				.setDescription(responseMessage)
				.setColor('#00FF00')
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
		}
	},
};
