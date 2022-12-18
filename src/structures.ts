export const MAIN_SCRIPT = `
Hooks.on("init", function() {
    console.log("This code runs once the Foundry VTT software begins its initialization workflow.");
});

Hooks.on("ready", function() {
    console.log("This code runs once core initialization is ready and game data is available.");
});
`.trim()

export const DEFAULT_LANG_FILE = `
ACTOR.TypeCharacter: Player Character
ACTOR.TypeNpc: No-Player Character

ITEM.TypeSpell: Spell
ITEM.TypeWeapon: Weapon
`.trim()
