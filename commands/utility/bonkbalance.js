/**
 * @file bonkbalance.js
 * @description Display user's current bonk coin balance and streak information
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.2.0
 * 
 * @changelog
 * - 1.2.0 (2024-08-01): Enhanced display with streak multiplier information
 * - 1.1.0 (2024-07-31): Added coin history and better formatting
 * - 1.0.0 (2024-07-31): Initial balance command for coin economy
 * 
 * @todo
 * - [ ] Add coin earning history graph
 * - [ ] Implement balance comparison with friends
 * - [ ] Add spending analytics
 * - [ ] Consider adding balance goals/achievements
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkbalance')
		.setDescription('Check your current bonk coins and streak'),
	async execute(interaction) {
		const userData = interaction.client.getUserData(interaction.user.id);

		const embed = new EmbedBuilder()
			.setTitle('💰 Your Bonk Coins')
			.setDescription(`Here's your current coin balance, ${interaction.user.displayName}!`)
			.addFields(
				{ name: '🪙 Bonk Coins', value: `${userData.bonkCoins}`, inline: true },
				{ name: '🔥 Daily Streak', value: `${userData.consecutiveLogins || 0}/7 days`, inline: true }
			)
			.setColor('#4169E1')
			.setTimestamp()
			.setThumbnail(interaction.user.displayAvatarURL());

		if (userData.isInJail) {
			const timeLeft = Math.max(0, userData.jailEndTime - Date.now());
			const minutesLeft = Math.ceil(timeLeft / 60000);
			embed.addFields({ 
				name: '🔒 Status', 
				value: `In horny jail for ${minutesLeft} more minute(s)`, 
				inline: false 
			});
		}

		await interaction.reply({ embeds: [embed] });
	},
};
