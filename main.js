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
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	] 
});
client.commands = new Collection();
client.config = botConfig; // Make config available to all commands

const dataPath = path.join(__dirname, 'data.json');
let userData = {};

// Throttle system for orphaned role cleanup to prevent spam
const orphanedRoleCleanupCooldown = new Map(); // userId -> lastCleanupTime
const CLEANUP_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between cleanup attempts per user

// Channel deletion timeout management to prevent memory leaks
const channelDeletionTimeouts = new Map(); // channelId -> timeoutId

// Rate limiting for bonk commands to prevent Discord API abuse
const bonkCooldowns = new Map(); // userId -> lastBonkTime
const BONK_COOLDOWN_MS = 3 * 1000; // 3 seconds between bonk attempts per user

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
	try {
		fs.writeFileSync(dataPath, JSON.stringify(userData, null, 2));
	} catch (error) {
		console.error('❌ Error saving data:', error);
	}
}

async function saveDataAsync() {
	try {
		await fs.promises.writeFile(dataPath, JSON.stringify(userData, null, 2));
	} catch (error) {
		console.error('❌ Error saving data:', error);
	}
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

	// First pass: Release users whose jail time has expired
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
				
				// Try to find the user in any guild
				for (const [guildId, guild] of client.guilds.cache) {
					try {
						const member = await guild.members.fetch(userId).catch(() => null);
						if (!member) {
							console.log(`User ${userId} not found in guild ${guild.name}, checking next guild...`);
							continue;
						}
						
						console.log(`Found user ${member.user.tag} in guild ${guild.name}, proceeding with release...`);
						const jailRoleName = client.config.jailSettings?.roleName || 'Horny Jail';
						const jailRole = guild.roles.cache.find(role => role.name === jailRoleName);
						
						if (!jailRole) {
							console.error(`Jail role "${jailRoleName}" not found in guild ${guild.name}`);
							continue;
						}
						
						// Check if user actually has the jail role
						if (member.roles.cache.has(jailRole.id)) {
							try {
								// Restore original roles if they exist
								if (user.originalRoles && user.originalRoles.length > 0) {
									console.log(`[RESTORE] Attempting to restore roles for ${member.user.tag}:`);
									console.log(`[RESTORE] Original roles saved:`, user.originalRoles);
									if (user.originalRolesDebug) {
										console.log(`[RESTORE] Role details:`, user.originalRolesDebug);
									}
									
									// Validate that the roles still exist in the server
									const validRoles = user.originalRoles.filter(roleId => 
										guild.roles.cache.has(roleId)
									);
									
									const invalidRoles = user.originalRoles.filter(roleId => 
										!guild.roles.cache.has(roleId)
									);
									
									if (invalidRoles.length > 0) {
										console.log(`[RESTORE] Invalid roles (no longer exist):`, invalidRoles);
									}
									
									if (validRoles.length > 0) {
										console.log(`[RESTORE] Valid roles to restore:`, validRoles);
										await member.roles.set(validRoles, 'Released from horny jail - restoring original roles');
										console.log(`✅ Released ${member.user.tag} from horny jail and restored ${validRoles.length}/${user.originalRoles.length} original roles`);
									} else {
										console.log(`⚠️ All original roles for ${member.user.tag} no longer exist, just removing jail role`);
										await member.roles.remove(jailRole.id, 'Released from horny jail - original roles invalid');
									}
								} else if (user.originalRolesDebug && user.originalRolesDebug.length > 0) {
									// Fallback: Use originalRolesDebug if originalRoles is empty
									console.log(`[RESTORE] originalRoles is empty, falling back to originalRolesDebug for ${member.user.tag}`);
									console.log(`[RESTORE] Role details from debug:`, user.originalRolesDebug);
									
									const roleIds = user.originalRolesDebug.map(roleInfo => roleInfo.id);
									const validRoles = roleIds.filter(roleId => 
										guild.roles.cache.has(roleId)
									);
									
									if (validRoles.length > 0) {
										console.log(`[RESTORE] Valid roles to restore from debug:`, validRoles);
										await member.roles.set(validRoles, 'Released from horny jail - restoring from debug backup');
										console.log(`✅ Restored ${validRoles.length} roles for ${member.user.tag} from debug backup`);
									} else {
										console.log(`⚠️ All debug roles for ${member.user.tag} no longer exist, just removing jail role`);
										await member.roles.remove(jailRole.id, 'Released from horny jail - debug roles invalid');
									}
								} else {
									// No original roles stored, just remove jail role
									console.log(`[RESTORE] No original roles saved for ${member.user.tag}, just removing jail role`);
									await member.roles.remove(jailRole.id, 'Released from horny jail');
									console.log(`✅ Released ${member.user.tag} from horny jail (no original roles to restore)`);
								}
							} catch (roleError) {
								console.error(`❌ Error restoring roles for ${member.user.tag}:`, roleError.message);
								// Try to at least remove the jail role
								try {
									await member.roles.remove(jailRole.id, 'Jail release - role restore failed');
									console.log(`⚠️ Removed jail role for ${member.user.tag} after role restore failure`);
								} catch (removeError) {
									console.error(`❌ Failed to remove jail role:`, removeError.message);
								}
							}
						} else {
							console.log(`⚠️ User ${member.user.tag} doesn't have jail role, but marked as jailed - restoring original roles anyway`);
							
							// Still try to restore original roles even if jail role is missing
							if (user.originalRoles && user.originalRoles.length > 0) {
								try {
									console.log(`[RESTORE] Jail role missing, but restoring original roles for ${member.user.tag}:`);
									console.log(`[RESTORE] Original roles saved:`, user.originalRoles);
									if (user.originalRolesDebug) {
										console.log(`[RESTORE] Role details:`, user.originalRolesDebug);
									}
									
									// Validate that the roles still exist in the server
									const validRoles = user.originalRoles.filter(roleId => 
										guild.roles.cache.has(roleId)
									);
									
									const invalidRoles = user.originalRoles.filter(roleId => 
										!guild.roles.cache.has(roleId)
									);
									
									if (invalidRoles.length > 0) {
										console.log(`[RESTORE] Invalid roles (no longer exist):`, invalidRoles);
									}
									
									if (validRoles.length > 0) {
										console.log(`[RESTORE] Valid roles to restore:`, validRoles);
										await member.roles.set(validRoles, 'Released from horny jail - restoring original roles (jail role was missing)');
										console.log(`✅ Restored ${validRoles.length}/${user.originalRoles.length} original roles for ${member.user.tag} (jail role was already removed)`);
									} else {
										console.log(`⚠️ All original roles for ${member.user.tag} no longer exist, no roles to restore`);
									}
								} catch (roleError) {
									console.error(`❌ Error restoring roles for ${member.user.tag}:`, roleError.message);
								}
							} else if (user.originalRolesDebug && user.originalRolesDebug.length > 0) {
								// Fallback: Use originalRolesDebug if originalRoles is empty
								try {
									console.log(`[RESTORE] originalRoles is empty, falling back to originalRolesDebug for ${member.user.tag}`);
									console.log(`[RESTORE] Role details from debug:`, user.originalRolesDebug);
									
									const roleIds = user.originalRolesDebug.map(roleInfo => roleInfo.id);
									const validRoles = roleIds.filter(roleId => 
										guild.roles.cache.has(roleId)
									);
									
									if (validRoles.length > 0) {
										console.log(`[RESTORE] Valid roles to restore from debug:`, validRoles);
										await member.roles.set(validRoles, 'Released from horny jail - restoring from debug backup');
										console.log(`✅ Restored ${validRoles.length} roles for ${member.user.tag} from debug backup`);
									} else {
										console.log(`⚠️ All debug roles for ${member.user.tag} no longer exist`);
									}
								} catch (roleError) {
									console.error(`❌ Error restoring roles from debug for ${member.user.tag}:`, roleError.message);
								}
							} else {
								console.log(`ℹ️ No original roles to restore for ${member.user.tag}`);
							}
						}
						
						// Delete their jail channel
						if (user.jailChannelId) {
							try {
								const jailChannel = guild.channels.cache.get(user.jailChannelId);
								if (jailChannel) {
									console.log(`Deleting jail channel for ${member.user.tag}...`);
									await jailChannel.send(`🔓 ${member} has been released from horny jail! This channel will be deleted in 5 seconds. Welcome back to freedom! 🎉`);
									const channelIdToDelete = user.jailChannelId; // Store before deleting from userData
									delete user.jailChannelId; // Clean up userData first
									
									// Clear any existing timeout for this channel
									if (channelDeletionTimeouts.has(channelIdToDelete)) {
										clearTimeout(channelDeletionTimeouts.get(channelIdToDelete));
									}
									
									const timeoutId = setTimeout(async () => {
										try {
											const channelToDelete = guild.channels.cache.get(channelIdToDelete);
											if (channelToDelete) {
												await channelToDelete.delete('User released from horny jail');
												console.log(`✅ Deleted individual jail channel for ${member.user.tag}`);
											}
										} catch (deleteError) {
											console.error(`❌ Error deleting jail channel:`, deleteError.message);
										} finally {
											// Clean up timeout reference
											channelDeletionTimeouts.delete(channelIdToDelete);
										}
									}, 5000);
									
									channelDeletionTimeouts.set(channelIdToDelete, timeoutId);
								} else {
									console.log(`⚠️ Jail channel ${user.jailChannelId} not found, cleaning up data...`);
									delete user.jailChannelId; // Channel doesn't exist, clean up
								}
							} catch (error) {
								console.error(`❌ Error handling jail channel cleanup:`, error.message);
								delete user.jailChannelId; // Clean up on error
							}
						}
						
						// Clean up original roles data
						delete user.originalRoles;
						delete user.originalRolesDebug;
						break; // Found and processed user, no need to check other guilds
						
					} catch (error) {
						console.error(`❌ Error releasing user ${userId} in guild ${guild.name}:`, error.message);
						continue;
					}
				}
			}
		}
	}

	// Second pass: Safety check for users with jail role but not marked as jailed (data corruption fix)
	for (const [guildId, guild] of client.guilds.cache) {
		try {
			const jailRoleName = client.config.jailSettings?.roleName || 'Horny Jail';
			const jailRole = guild.roles.cache.find(role => role.name === jailRoleName);
			
			if (jailRole) {
				const membersWithJailRole = guild.members.cache.filter(member => {
					const hasJailRole = member.roles.cache.has(jailRole.id);
					const isMarkedJailed = userData[member.id]?.isInJail;
					const lastCleanup = orphanedRoleCleanupCooldown.get(member.id) || 0;
					const cooldownExpired = (Date.now() - lastCleanup) > CLEANUP_COOLDOWN_MS;
					
					return hasJailRole && !isMarkedJailed && cooldownExpired;
				});
				
				if (membersWithJailRole.size > 0) {
					console.log(`🔍 Found ${membersWithJailRole.size} users with jail role but not marked as jailed - fixing data corruption...`);
					
					for (const [memberId, member] of membersWithJailRole) {
						try {
							console.log(`🔧 Attempting to remove jail role from ${member.user.tag} (ID: ${memberId})`);
							console.log(`   - Current roles: ${member.roles.cache.map(r => r.name).join(', ')}`);
							console.log(`   - Has jail role: ${member.roles.cache.has(jailRole.id)}`);
							console.log(`   - Data state: isInJail=${userData[memberId]?.isInJail}, jailEndTime=${userData[memberId]?.jailEndTime}`);
							
							// Set cooldown for this user
							orphanedRoleCleanupCooldown.set(memberId, Date.now());
							
							// Force refresh member data from Discord
							await member.fetch();
							
							if (member.roles.cache.has(jailRole.id)) {
								await member.roles.remove(jailRole.id, 'Auto-cleanup - removing orphaned jail role');
								console.log(`✅ Successfully removed jail role from ${member.user.tag}`);
								
								// Verify removal after a short delay
								await new Promise(resolve => setTimeout(resolve, 1000));
								await member.fetch();
								if (member.roles.cache.has(jailRole.id)) {
									console.log(`⚠️ WARNING: Role still present after removal for ${member.user.tag}`);
								} else {
									console.log(`✅ Verified: Role successfully removed for ${member.user.tag}`);
								}
							} else {
								console.log(`ℹ️ User ${member.user.tag} no longer has jail role (cached data outdated)`);
							}
							
							// Clean up any leftover jail data
							if (userData[memberId]) {
								userData[memberId].isInJail = false;
								userData[memberId].jailEndTime = null;
								delete userData[memberId].jailChannelId;
								delete userData[memberId].originalRoles;
								console.log(`🧹 Cleaned up jail data for ${member.user.tag}`);
							}
						} catch (error) {
							console.error(`❌ Error removing orphaned jail role from ${member.user.tag}:`, error.message);
							console.error(`   Full error:`, error);
						}
					}
				}
			}
		} catch (error) {
			console.error(`❌ Error in safety check for guild ${guild.name}:`, error.message);
		}
	}
	
	console.log(`Jail check complete. Found ${jailedUsers} jailed users, released ${releasedUsers} users`);
	saveData();
}// Emergency function to release everyone
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
						const jailRole = guild.roles.cache.find(role => role.name === client.config.jailSettings?.roleName || 'Horny Jail');
						
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
client.saveDataAsync = saveDataAsync;

// Helper function to check bonk cooldown
client.checkBonkCooldown = function(userId) {
	const lastBonk = bonkCooldowns.get(userId) || 0;
	const now = Date.now();
	const timeLeft = BONK_COOLDOWN_MS - (now - lastBonk);
	
	if (timeLeft > 0) {
		return { onCooldown: true, timeLeft: Math.ceil(timeLeft / 1000) };
	}
	
	bonkCooldowns.set(userId, now);
	return { onCooldown: false, timeLeft: 0 };
};

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

// Message listener for good behavior tracking in jail channels
client.on(Events.MessageCreate, async message => {
	// Ignore bot messages and DMs
	if (message.author.bot || !message.guild) return;
	
	// Check if this is a jail channel
	if (!message.channel.name.startsWith('horny-jail-')) return;
	
	// Check if the message author is in jail
	const userData = getUserData(message.author.id);
	if (!userData.isInJail) return;
	
	// Initialize good behavior tracking
	if (!userData.goodBehavior) {
		userData.goodBehavior = {
			messagesInJail: 0,
			timeReduction: 0,
			lastMessage: null
		};
	}
	
	// Track message (with cooldown to prevent spam)
	const now = Date.now();
	if (!userData.goodBehavior.lastMessage || (now - userData.goodBehavior.lastMessage) > 30000) { // 30 second cooldown
		userData.goodBehavior.messagesInJail++;
		userData.goodBehavior.lastMessage = now;
		
		// Every 10 messages, apply time reduction
		if (userData.goodBehavior.messagesInJail % 10 === 0) {
			const reductionMinutes = 2; // 2 minutes reduction per 10 messages
			const reductionMs = reductionMinutes * 60 * 1000;
			
			if (userData.jailEndTime && userData.jailEndTime > now) {
				const originalEndTime = userData.jailEndTime;
				userData.jailEndTime = Math.max(now + 60000, userData.jailEndTime - reductionMs); // Minimum 1 minute left
				
				if (userData.jailEndTime < originalEndTime) {
					const actualReduction = Math.max(1, Math.floor((originalEndTime - userData.jailEndTime) / 60000)); // Ensure at least 1 minute reduction
					await message.react('⏰');
					await message.channel.send(`🎉 **Good behavior bonus!** ${message.author.displayName} earned **${actualReduction} minute(s)** off their sentence! Keep being active! 📖✨`);
				}
			}
		}
		
		saveData();
	}
});

client.login(token);
