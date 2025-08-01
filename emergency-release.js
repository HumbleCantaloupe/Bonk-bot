const fs = require('node:fs');
const path = require('node:path');

// Load data
const dataPath = path.join(__dirname, 'data.json');
let userData = {};

if (fs.existsSync(dataPath)) {
	try {
		userData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
		console.log('Data loaded successfully');
	} catch (error) {
		console.error('Error loading data:', error);
		process.exit(1);
	}
}

// Force release all jailed users
console.log('🚨 EMERGENCY RELEASE - Clearing all jail data 🚨');

let releasedCount = 0;
for (const userId in userData) {
	const user = userData[userId];
	if (user.isInJail) {
		console.log(`Releasing user ${userId} from jail`);
		user.isInJail = false;
		user.jailEndTime = null;
		delete user.originalRoles;
		delete user.jailChannelId;
		releasedCount++;
	}
}

// Save the cleaned data
fs.writeFileSync(dataPath, JSON.stringify(userData, null, 2));
console.log(`✅ Released ${releasedCount} users from jail data`);
console.log('⚠️  Note: You still need to run the bot to clean up Discord roles and channels');
