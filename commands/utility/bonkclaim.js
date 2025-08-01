/**
 * @file bonkclaim.js
 * @description Daily coin claiming system with streak bonuses and power-up effects
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.5.0
 * 
 * @changelog
 * - 1.5.0 (2024-08-01): Added double coin boost power-up integration
 * - 1.4.0 (2024-07-31): Improved streak calculation and bonus system
 * - 1.3.0 (2024-07-31): Added progressive streak rewards (3-6 coins)
 * - 1.2.0 (2024-07-31): Implemented 24-hour cooldown system
 * - 1.0.0 (2024-07-31): Initial daily claim system replacing credit resets
 * 
 * @todo
 * - [ ] Add monthly streak milestones
 * - [ ] Implement claim streak leaderboards
 * - [ ] Add bonus coin events on weekends
 * - [ ] Consider adding claim reminder system
 * 
 * @dependencies discord.js
 * @permissions SendMessages, EmbedLinks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const dailyRewards = [
	{ day: 1, coins: 3 },
	{ day: 2, coins: 3 },
	{ day: 3, coins: 4 },
	{ day: 4, coins: 4 },
	{ day: 5, coins: 5 },
	{ day: 6, coins: 5 },
	{ day: 7, coins: 6 }
];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bonkclaim')
		.setDescription('Claim your daily bonk coins'),
	async execute(interaction) {
		const userData = interaction.client.getUserData(interaction.user.id);
		const today = new Date().toDateString();
		
		if (userData.lastDailyBonus === today) {
			return await interaction.reply({ 
				content: '❌ You already claimed your daily coins today! Come back tomorrow.', 
				ephemeral: true 
			});
		}

		// Streak calculation
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		
		if (userData.lastDailyBonus === yesterday.toDateString()) {
			userData.consecutiveLogins = Math.min(userData.consecutiveLogins + 1, 7);
		} else {
			userData.consecutiveLogins = 1;
		}

		const reward = dailyRewards[userData.consecutiveLogins - 1];
		let bonusCoins = reward.coins;
		
		// Double coin boost effect
		let boostActive = false;
		if (userData.activeEffects && userData.activeEffects.doubleCoinUntil && Date.now() < userData.activeEffects.doubleCoinUntil) {
			bonusCoins *= 2;
			boostActive = true;
		}

		userData.bonkCoins += bonusCoins;
		userData.lastDailyBonus = today;
		interaction.client.saveData();

		const embed = new EmbedBuilder()
			.setTitle('🎁 Daily Coins Claimed!')
			.setDescription(`Day ${userData.consecutiveLogins} of your login streak!${boostActive ? '\n💰 **Double Coin Boost Active!**' : ''}`)
			.addFields(
				{ name: '💰 Coins Earned', value: `+${bonusCoins}${boostActive ? ' (doubled!)' : ''}`, inline: true },
				{ name: '🪙 Total Coins', value: `${userData.bonkCoins}`, inline: true },
				{ name: '🔥 Streak', value: `${userData.consecutiveLogins}/7 days`, inline: true }
			)
			.setColor('#00FF00')
			.setTimestamp();

		if (userData.consecutiveLogins === 7) {
			embed.setFooter({ text: 'Amazing! You\'ve completed a full week! Bonus coins for dedication!' });
		}

		await interaction.reply({ embeds: [embed] });
	},
};
