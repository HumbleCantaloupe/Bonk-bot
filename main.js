/**
 * @file main.js
 * @description Core Discord bot handler for the Bonk Bot system
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 3.2.0
 * 
 * @changelog
 * - 3.2.0 (2024-08-01): Added startup recovery system, improved jail release logic
 * - 3.1.0 (2024-08-01): Implemented individual jail channels with auto-cleanup
 * - 3.0.0 (2024-07-31): Major refactor - removed complex shop, simplified economy
 * - 2.5.0 (2024-07-31): Added special events system and immunity management
 * - 2.0.0 (2024-07-31): Switched from credit system to accumulating coin economy
 * - 1.0.0 (2024-07-31): Initial bot setup with basic bonking functionality
 * 
 * @dependencies discord.js, node:fs, node:path
 * @permissions Administrator (for full functionality)
 */

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const { token } = require('./config.json');

// Load bot configuration
let botConfig = {};
try {
	botConfig = JSON.parse(fs.readFileSync('./bot-config.json', 'utf8'));
	console.log(`✅ Loaded bot configuration v${botConfig.botSettings.version}`);
} catch (error) {
	console.error('❌ Error loading bot-config.json:', error);
	console.log('Using default configuration...');
	// Fallback to basic config if file doesn't exist
	botConfig = {
		jailSettings: { roleName: 'Horny Jail', roleColor: '#FF69B4' },
		economySettings: { startingCoins: 3 },
		systemSettings: { jailCheckInterval: 60000 }
	};
}

const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds
	] 
});
client.commands = new Collection();
client.config = botConfig; // Make config available to all commands

const dataPath = path.join(__dirname, 'data.json');
let userData = {};

// Load saved data
if (fs.existsSync(dataPath)) {
	try {
		userData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
	} catch (error) {
		console.error('Error loading data:', error);
		userData = {};
	}
}

function saveData() {
	fs.writeFileSync(dataPath, JSON.stringify(userData, null, 2));
}

// Fix broken permissions after bot restarts
async function startupRecovery(client) {
	console.log('🔧 Running startup recovery to fix any broken jail permissions...');
	
	for (const [guildId, guild] of client.guilds.cache) {
		try {
			const jailRoleName = client.config.jailSettings?.roleName || 'Horny Jail';
			const jailRole = guild.roles.cache.find(role => role.name === jailRoleName);
			if (!jailRole) continue;
			
			const jailedMembers = guild.members.cache.filter(member => 
				member.roles.cache.has(jailRole.id)
			);
			
			console.log(`Found ${jailedMembers.size} members with Horny Jail role in ${guild.name}`);
			
			for (const [memberId, member] of jailedMembers) {
				try {
					const userRecord = userData[memberId];
					
					// First, restore original roles if they exist
					if (userRecord && userRecord.originalRoles && userRecord.originalRoles.length > 0) {
						try {
							await member.roles.set(userRecord.originalRoles, 'Startup recovery - restoring original roles');
							console.log(`✅ Restored ${userRecord.originalRoles.length} original roles for ${member.user.tag}`);
						} catch (roleError) {
							console.error(`❌ Error restoring roles for ${member.user.tag}:`, roleError.message);
							// If restoring roles fails, at least remove the jail role
							await member.roles.remove(jailRole, 'Startup recovery - removing orphaned jail role');
						}
					} else {
						// No original roles stored, just remove jail role
						await member.roles.remove(jailRole, 'Startup recovery - removing orphaned jail role');
					}
					
					// Clean up user data
					if (userRecord) {
						userRecord.isInJail = false;
						userRecord.jailEndTime = null;
						
						if (userRecord.jailChannelId) {
							const jailChannel = guild.channels.cache.get(userRecord.jailChannelId);
							if (jailChannel) {
								await jailChannel.delete('Startup recovery - cleaning orphaned jail channel');
								console.log(`Deleted orphaned jail channel for ${member.user.tag}`);
							}
							delete userRecord.jailChannelId;
						}
						
						delete userRecord.originalRoles;
					}
					
					console.log(`✅ Recovered ${member.user.tag} - restored permissions and cleaned up data`);
					
				} catch (error) {
					console.error(`❌ Error recovering ${member.user.tag}:`, error);
				}
			}
			
			// Clean up orphaned jail channels
			const jailChannels = guild.channels.cache.filter(channel => 
				channel.name.startsWith('horny-jail-') && channel.type === 0
			);
			
			for (const [channelId, channel] of jailChannels) {
				try {
					const userWithChannel = Object.values(userData).find(user => 
						user.jailChannelId === channelId
					);
					
					if (!userWithChannel) {
						await channel.delete('Startup recovery - orphaned jail channel');
						console.log(`🗑️ Deleted orphaned jail channel: ${channel.name}`);
					}
				} catch (error) {
					console.error(`Error cleaning up jail channel ${channel.name}:`, error);
				}
			}
			
		} catch (error) {
			console.error(`Error during startup recovery for guild ${guild.name}:`, error);
		}
	}
	
	saveData();
	console.log('✅ Startup recovery completed');
}

function getUserData(userId) {
	if (!userData[userId]) {
		userData[userId] = {
			bonkCoins: botConfig.economySettings?.startingCoins || 3,
			isInJail: false,
			jailEndTime: null,
			originalRoles: [],
			// Statistics
			totalBonksGiven: 0,
			totalBonksReceived: 0,
			longestJailTime: 0,
			bonkStreak: 0,
			lastBonkDate: null,
			// Economy
			lastDailyBonus: null,
			lastWorkTime: null,
			consecutiveLogins: 0
		};
	}
	return userData[userId];
}

// Check for users to release from jail
async function checkJailReleases(client) {
	const now = Date.now();
	console.log(`Checking jail releases at ${new Date().toLocaleTimeString()}`);
	
	let jailedUsers = 0;
	let releasedUsers = 0;
	
	for (const userId in userData) {
		const user = userData[userId];
		if (user.isInJail) {
			jailedUsers++;
			console.log(`User ${userId} is in jail. End time: ${new Date(user.jailEndTime).toLocaleTimeString()}, Current time: ${new Date(now).toLocaleTimeString()}`);
			
			if (user.jailEndTime && now >= user.jailEndTime) {
				console.log(`Releasing user ${userId} from jail`);
				user.isInJail = false;
				user.jailEndTime = null;
				releasedUsers++;
				
				for (const [guildId, guild] of client.guilds.cache) {
				try {
					const member = await guild.members.fetch(userId).catch(() => null);
					if (!member) {
						// User left the server, clean up their jail channel
						if (user.jailChannelId) {
							try {
								const jailChannel = guild.channels.cache.get(user.jailChannelId);
								if (jailChannel) {
									await jailChannel.delete('User left server while in jail');
									console.log(`Deleted abandoned jail channel for user ${userId}`);
								}
								delete user.jailChannelId;
							} catch (deleteError) {
								console.error(`Error cleaning up abandoned jail channel:`, deleteError);
								delete user.jailChannelId;
							}
						}
						continue;
					}
					const jailRoleName = client.config.jailSettings?.roleName || 'Horny Jail';
					const jailRole = guild.roles.cache.find(role => role.name === jailRoleName);
					
					if (member.roles.cache.has(jailRole?.id)) {
						try {
							// Restore original roles if they exist
							if (user.originalRoles && user.originalRoles.length > 0) {
								await member.roles.set(user.originalRoles, 'Released from horny jail - restoring original roles');
								console.log(`Released ${member.user.tag} from horny jail and restored ${user.originalRoles.length} original roles`);
							} else {
								// No original roles stored, just remove jail role
								await member.roles.remove(jailRole.id, 'Released from horny jail');
								console.log(`Released ${member.user.tag} from horny jail`);
							}
						} catch (roleError) {
							console.error(`Error restoring roles for ${member.user.tag}:`, roleError.message);
						}
						
						// Delete their jail channel
						if (user.jailChannelId) {
							try {
								const jailChannel = guild.channels.cache.get(user.jailChannelId);
								if (jailChannel) {
									await jailChannel.send(`🔓 ${member} has been released from horny jail! This channel will be deleted in 5 seconds. Welcome back to freedom! 🎉`);
									const channelIdToDelete = user.jailChannelId; // Store before deleting from userData
									delete user.jailChannelId; // Clean up userData first
									setTimeout(async () => {
										try {
											const channelToDelete = guild.channels.cache.get(channelIdToDelete);
											if (channelToDelete) {
												await channelToDelete.delete('User released from horny jail');
												console.log(`Deleted individual jail channel for ${member.user.tag}`);
											}
										} catch (deleteError) {
											console.error(`Error deleting jail channel:`, deleteError);
										}
									}, 5000);
								} else {
									delete user.jailChannelId; // Channel doesn't exist, clean up
								}
							} catch (error) {
								console.error(`Error handling jail channel cleanup:`, error);
								delete user.jailChannelId; // Clean up on error
							}
						}
					}
				} catch (error) {
					console.error(`Error releasing user ${userId}:`, error);
				}
			}
			
			delete user.originalRoles;
			}
		}
	}
	
	console.log(`Jail check complete. Found ${jailedUsers} jailed users, released ${releasedUsers} users`);
	saveData();
}

// Emergency function to release everyone
async function forceReleaseAll(client) {
	console.log('🚨 FORCE RELEASING ALL JAILED USERS 🚨');
	let releasedCount = 0;
	
	for (const userId in userData) {
		const user = userData[userId];
		if (user.isInJail) {
			console.log(`Force releasing user ${userId}`);
			user.isInJail = false;
			user.jailEndTime = null;
			releasedCount++;
			
			for (const [guildId, guild] of client.guilds.cache) {
				try {
					const member = await guild.members.fetch(userId).catch(() => null);
					if (member) {
						const jailRole = guild.roles.cache.find(role => role.name === 'Horny Jail');
						
						if (jailRole && member.roles.cache.has(jailRole.id)) {
							await member.roles.remove(jailRole, 'Force released from jail');
							console.log(`Removed jail role from ${member.user.tag}`);
						}
						
						// Remove jail role permissions from all channels
						const textChannels = guild.channels.cache.filter(channel => channel.type === 0);
						for (const [channelId, channel] of textChannels) {
							try {
								if (jailRole) {
									await channel.permissionOverwrites.delete(jailRole);
								}
							} catch (error) {
								console.error(`Error restoring permissions in ${channel.name}:`, error.message);
							}
						}
						
						if (user.jailChannelId) {
							try {
								const jailChannel = guild.channels.cache.get(user.jailChannelId);
								if (jailChannel) {
									await jailChannel.delete('Force cleanup - releasing all jailed users');
									console.log(`Deleted jail channel for ${member.user.tag}`);
								}
							} catch (error) {
								console.error(`Error deleting jail channel:`, error.message);
							}
							delete user.jailChannelId;
						}
					}
				} catch (error) {
					console.error(`Error force releasing user ${userId}:`, error.message);
				}
			}
			
			delete user.originalRoles;
		}
	}
	
	console.log(`✅ Force released ${releasedCount} users from jail`);
	saveData();
}

// Run checks based on configured interval
setInterval(async () => {
	await checkJailReleases(client);
	checkSpecialEvents();
}, botConfig.systemSettings?.jailCheckInterval || 60000);

client.getUserData = getUserData;
client.saveData = saveData;

// Special events stuff
const specialEvents = {
	doubleCreditsActive: false,
	bonkImmunityUsers: [], // User IDs with immunity
	eventMultiplier: 1, // Credit multiplier for events
	eventEndTime: null
};

function checkSpecialEvents() {
	if (specialEvents.eventEndTime && Date.now() > specialEvents.eventEndTime) {
		specialEvents.doubleCreditsActive = false;
		specialEvents.eventMultiplier = 1;
		specialEvents.eventEndTime = null;
		console.log('Special bonk event expired');
		saveData();
	}
}

client.specialEvents = specialEvents;
client.checkSpecialEvents = checkSpecialEvents;

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

client.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	
	await startupRecovery(client);
	await checkJailReleases(client);
});

client.login(token);
