/**
 * @file bonkgift.js
 * @description Coin gifting system for sharing wealth between users
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.2.0
 * 
 * @changelog
 * - 1.2.0 (2024-08-01): Added gift limits and anti-abuse measures
 * - 1.1.0 (2024-07-31): Enhanced embed design and confirmation messages
 * - 1.0.0 (2024-07-31): Initial gift system for coin economy
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkgift')
		.setDescription('Gift bonk coins to another user')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User to gift coins to')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('Amount of coins to gift')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(500)),
	async execute(interaction) {
		const userData = interaction.client.getUserData(interaction.user.id);
		const targetUser = interaction.options.getUser('user');
		const amount = interaction.options.getInteger('amount');

		if (targetUser.id === interaction.user.id) {
			return await interaction.reply({ 
				content: '❌ You cannot gift coins to yourself!', 
				ephemeral: true 
			});
		}

		if (userData.bonkCoins < amount) {
			return await interaction.reply({ 
				content: `💸 You don't have enough bonk coins! You only have ${userData.bonkCoins} coins.`, 
				ephemeral: true 
			});
		}

		const targetData = interaction.client.getUserData(targetUser.id);
		userData.bonkCoins -= amount;
		targetData.bonkCoins += amount;
		interaction.client.saveData();

		const embed = new EmbedBuilder()
			.setTitle('🎁 Gift Sent!')
			.setDescription(`You gifted **${amount} bonk coins** to ${targetUser}!`)
			.addFields({ name: '💰 Your Balance', value: `${userData.bonkCoins} coins`, inline: true })
			.setColor('#FFB6C1')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
