/**
 * @file bonkgamble.js
 * @description Coin gambling system with lucky charm power-up integration
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.3.0
 * 
 * @changelog
 * - 1.3.0 (2024-08-01): Added lucky charm effect for better odds
 * - 1.2.0 (2024-07-31): Balanced odds and improved visual feedback
 * - 1.1.0 (2024-07-31): Added maximum bet limits and safety checks
 * - 1.0.0 (2024-07-31): Initial gambling system with 4-tier outcomes
 * 
 * @todo
 * - [ ] Add different gambling game modes
 * - [ ] Implement progressive jackpot system
 * - [ ] Add gambling addiction prevention measures
 * - [ ] Consider adding tournament betting
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkgamble')
		.setDescription('Gamble your bonk coins (risky!)')
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('Amount of coins to gamble')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100)),
	async execute(interaction) {
		const userData = interaction.client.getUserData(interaction.user.id);
		const amount = interaction.options.getInteger('amount');
		
		if (userData.bonkCoins < amount) {
			return await interaction.reply({ 
				content: `💸 You don't have enough bonk coins! You only have ${userData.bonkCoins} coins.`, 
				ephemeral: true 
			});
		}

		const random = Math.random();
		let multiplier = 0;
		let result = '';
		
		// Lucky charm effect
		let luckyActive = false;
		if (userData.activeEffects && userData.activeEffects.luckyActive) {
			luckyActive = true;
			userData.activeEffects.luckyActive = false;
		}

		// Better odds with lucky charm
		const adjustedRandom = luckyActive ? Math.max(0, random - 0.2) : random;

		if (adjustedRandom < 0.45) {
			multiplier = 0;
			result = '💥 You lost everything! Better luck next time.';
		} else if (adjustedRandom < 0.75) {
			multiplier = 1.5;
			result = '🎉 You won! Small victory!';
		} else if (adjustedRandom < 0.90) {
			multiplier = 2;
			result = '🚀 Big win! You doubled your coins!';
		} else {
			multiplier = 3;
			result = '💎 JACKPOT! Triple your coins!';
		}
		
		if (luckyActive) {
			result += '\n🍀 **Lucky Charm boost applied!**';
		}

		const winnings = Math.floor(amount * multiplier);
		userData.bonkCoins -= amount;
		userData.bonkCoins += winnings;
		interaction.client.saveData();

		const embed = new EmbedBuilder()
			.setTitle('🎰 Gambling Results')
			.setDescription(result)
			.addFields(
				{ name: '💰 Bet', value: `${amount} coins`, inline: true },
				{ name: '🎁 Winnings', value: `${winnings} coins`, inline: true },
				{ name: '📊 Net Result', value: `${winnings - amount >= 0 ? '+' : ''}${winnings - amount} coins`, inline: true }
			)
			.setColor(winnings > amount ? '#00FF00' : '#FF0000')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
