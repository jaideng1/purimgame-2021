const { createVector, getShorterLinePoints, getCircumcenter, dist} = require("./math-funcs.js")
const FORM_KEY = "SavingEstherWasABitHardAndEasy.";

const BasePlayerStats = {
  maxBaseHealth: 15,
  baseStrength: 2,
  baseDefense: 2
}

const CLASSES = {
  SOLDIER: "Soldier",
  RABBI: "Rabbi", //Healer kinda
  SORCERER: "Sorcerer",
}

const PLAYER_SPEED = 5;
const PLAYER_SIZE = 40;
const BASE_ATTACK_COOLDOWN = 1000; //In milliseconds.

function rgb(r, g, b) {
  return {r,g,b}
}

const colors = [
  rgb(255, 84, 71),
  rgb(250, 186, 37),
  rgb(240, 227, 50),
  rgb(67, 202, 230),
  rgb(22, 54, 240),
  rgb(232, 30, 225)
]

class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.maxHealth = BasePlayerStats.maxBaseHealth;
    this.health = this.maxHealth;
    this.defense = BasePlayerStats.baseDefense;
    this.class = CLASSES.SOLDIER;
    this.items = [];
    this.hotbar = [];
    this.activeHotbar = 0;
    this.armor = [];

    this.color = colors[Math.floor(Math.random() * colors.length)];

    this.dead = false;

    this.party = null;

    //For Rabbi
    this.healAmounts = 3;

    this.cooldown = 0; //BASE_ATTACK_COOLDOWN for the max cooldown. it's also affected by the active weapon speed.

    this.x = 0;
    this.y = 0;
  }
  switchClass() {
    let newClass = "";
    if (this.class == CLASSES.SOLDIER) {
      newClass = CLASSES.RABBI;
    } else if (this.class == CLASSES.RABBI) {
      newClass = CLASSES.SORCERER;
    } else if (this.class == CLASSES.SORCERER) {
      newClass = CLASSES.SOLDIER;
    }
    this.class = newClass;
    return newClass;
  }
  //Movement from keys
  processKeys(keys) {
    if (this.party.room == null) return;
    if (this.isDead()) return;
    //Movement
    if (keys["W"]) {
      this.y -= PLAYER_SPEED;
      if (this.y < 0) {
        this.y = 0;
      }
    }
    if (keys["A"]) {
      this.x -= PLAYER_SPEED;
      if (this.x < 0) {
        this.x = 0;
      }
    }
    if (keys["S"]) {
      this.y += PLAYER_SPEED;
      if (this.y + PLAYER_SIZE > this.party.room.height) {
        this.y = this.party.room.height - PLAYER_SIZE;
      }
    }
    if (keys["D"]) {
      this.x += PLAYER_SPEED;
      if (this.x + PLAYER_SIZE > this.party.room.width) {
        this.x = this.party.room.width - PLAYER_SIZE;
      }
    }

    //Hotbar
    if (keys["1"]) {
      this.activeHotbar = 0;
    } else if (keys["2"]) {
      this.activeHotbar = 1;
    } else if (keys["3"]) {
      this.activeHotbar = 2;
    }
  }
  lockInClass() {
    let baseItems = Item.getBaseItems();
    this.hotbar.push(baseItems[this.class]);
  }
  isDead() {
    this.dead = (this.health <= 0);
    return this.dead;
  }
  attack(attackArea) {
    if (this.isDead()) return;

    let dt = new Date();
    if (dt.getTime() < this.cooldown) return false;
    if (this.hotbar[this.activeHotbar] == null) return false;
    if (this.hotbar[this.activeHotbar].stats["attack_damage"] == null) return false;

    this.cooldown = dt.getTime() + BASE_ATTACK_COOLDOWN + ((this.hotbar[this.activeHotbar].stats["speed"] != null) ? this.hotbar[this.activeHotbar].stats["speed"] : 0);

    if (this.class == CLASSES.SOLDIER) {
      for (let en of this.party.room.entities) {
        if (en.entity_type == ENTITY_TYPES.ENEMY) {
          let middleOfEnemy = createVector(en.x + (ENEMY_SIZE / 2), en.y + (ENEMY_SIZE / 2))
          if (dist(middleOfEnemy, getCircumcenter(attackArea.middleOfPlayer, attackArea.vec, attackArea.vec2)) <= 50) {
            en.damage(this.hotbar[this.activeHotbar].stats["attack_damage"] + 2);
          }
        }
      }

    } else if (this.class == CLASSES.RABBI) {
      for (let en of this.party.room.entities) {
        if (en.entity_type == ENTITY_TYPES.ENEMY) {
          let middleOfEnemy = createVector(en.x + (ENEMY_SIZE / 2), en.y + (ENEMY_SIZE / 2))
          let mouse = attackArea.mouse;
          if (mouse.x >= en.x && mouse.x <= en.x + ENEMY_SIZE && mouse.y >= en.y && mouse.y <= en.y + ENEMY_SIZE) {
            en.damage(this.hotbar[this.activeHotbar].stats["attack_damage"]);
          }
        }
      }

      if (this.healAmounts > 0) {
        let clickedOnPlayer = false;
        for (let p_ of this.party.players) {
          let mouse = attackArea.mouse;
          if (mouse.x >= p_.x && mouse.x <= p_.x + PLAYER_SIZE && mouse.y >= p_.y && mouse.y <= p_.y + PLAYER_SIZE) {
            p_.health += 2;
            clickedOnPlayer = true;
          }
        }
        if (clickedOnPlayer) this.healAmounts--;
      }
    } else if (this.class == CLASSES.SORCERER) {
      for (let en of this.party.room.entities) {
        if (en.entity_type == ENTITY_TYPES.ENEMY) {
          let middleOfEnemy = createVector(en.x + (ENEMY_SIZE / 2), en.y + (ENEMY_SIZE / 2))
          let mouse = attackArea.mouse;
          if (mouse.x >= en.x && mouse.x <= en.x + ENEMY_SIZE && mouse.y >= en.y && mouse.y <= en.y + ENEMY_SIZE) {
            en.damage(this.hotbar[this.activeHotbar].stats["attack_damage"], true);
          }
        }
      }
    }

    return true;
  }
  damage(dmg) {
    this.health -= (dmg - (this.defense / 1.5));
    return this.isDead();
  }
  getJSONPrep() {
    return {
      id: this.id,
      name: this.name,
      maxHealth: this.maxHealth,
      health: this.health,
      defense: this.defense,
      class: this.class,
      items: this.items,
      hotbar: this.hotbar,
      activeHotbar: this.activeHotbar,
      armor: this.armor,
      currentAttackCooldown: this.cooldown,
      x: this.x,
      y: this.y,
      healAmounts: this.healAmounts,
      color: this.color
    }
  }

}


class Party {
  constructor(code) {
    this.level = -1;
    this.players = [];
    this.code = code;
    this.room = null;

    this.winningCode = null;

    this.emittedDeathCode = false;
    this.skipPastEnd = false;

    this.updateInterval = null;
  }
  addPlayerToParty(player) {
    player.party = this;
    this.players.push(player);
  }
  getPlayerEmitCodes() {
    let codes = [];
    for (let i = 0; i < this.players.length; i++) {
      codes.push(this.players[i].id);
    }
    return codes;
  }
  allPlayersDead() {
    let count = 0;
    for (let p of this.players) {
      if (p.isDead()) count++;
    }
    return count == this.players.length;
  }
  partyReady(updateInterval) {
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].lockInClass();
    }
    this.updateInterval = updateInterval;
    this.enterNewRoom();
    return {
      to: this.getPlayerEmitCodes(),
      info: this
    }
  }
  enterNewRoom() {
    if (this.skipPastEnd && this.level == 9) {
      this.level += 2;
    } else {
      this.level++;
    }
    if (this.level == 10) {
      this.winningCode = FORM_KEY;
    }
    if (this.level > 0) {
      for (let p of this.players) {
        if (p.hotbar.length < 3) {
          p.hotbar.push(Item.randomItem(p.class, this.level));
        } else {
          p.hotbar[Math.floor(Math.random() * 3)] = Item.randomItem(p.class, this.level);
        }
      }
    }
    this.room = new Room(this.level, this);
    for (let p in this.players) {
      this.players[p].y = (250 - (this.players.length / 2 * 50)) + (p * 40);
      this.players[p].x = 15;

      //Set player's health to above 0
      this.players[p].health = this.players[p].maxHealth;
      this.players[p].dead = false;
      this.players[p].healAmounts = (3 + Math.floor(this.level / 2));
    }

    //Return emitting codes
    return {
      to: this.getPlayerEmitCodes(),
      info: this
    };
  }
  doChecks() {
    this.updateEnemies();
  }
  updateEnemies() {
    //If the room isn't null, loop through all entities, if the entity type is an "Enemy", then update it passing through this party.
    if (this.room != null) for (let en of this.room.entities) if (en.entity_type == "Enemy") en.update(this);
  }
  getJSONPrep(checks=true) {
    let pjsn = [];
    for (let p of this.players) {
      pjsn.push(p.getJSONPrep())
    }
    if (checks) this.doChecks();
    //if (this.winningCode != null) console.log(this.winningCode)
    return {
      level: this.level,
      players: pjsn,
      code: this.code,
      room: (!!this.room) ? this.room.getJSONPrep() : null,
      winningCode: this.winningCode,
      skipPastEnd: this.skipPastEnd
    }
  }
}

//Exit Door: {x: 460, y: 200, w: 40, h: 200}

class Room {
  constructor(level, party) {
    this.difficulty = level; //Difficulty scales based off of level, 0 is lowest (basic instructions), while as you go higher the difficulty gets harder.
    this.entities = [];
    this.width = 500;
    this.height = 500;
    this.party = party;
    this.init();
  }
  init() {
    let enemyCount = 1 + ((this.difficulty) * 2);
    for (let i = 0; i < enemyCount; i++) {
      this.entities.push(new Enemy(this.difficulty, 440, (250 - (enemyCount / 2 * 50)) + (i * 40), ENEMY_TYPES.CLOSE_RANGE));
    }
  }
  allEnemiesDead() {
    let cnt = 0;
    let en_cnt = 0;
    for (let e of this.entities) {
      if (e.entity_type != ENTITY_TYPES.ENEMY) continue;
      en_cnt++;
      if (e.isDead()) cnt++;
    }
    return (cnt == en_cnt);
  }
  getJSONPrep() {
    return {
      difficulty: this.difficulty,
      entities: this.entities,
      width: this.width,
      height: this.height
    }
  }
}

const BaseHealth = 10;
const BaseStrength = 2;
const BaseDefense = 4;

const ENEMY_TYPES = {
  DEFENSIVE: "Guard",
  LONG_RANGE: "Mage",
  CLOSE_RANGE: "Fighter"
}

const ENTITY_TYPES = {
  ENEMY: "Enemy",
  ITEM: "Item",
  BLOCK: "Block"
}

const ENEMY_SIZE = 40;

class Enemy {
  constructor(scale, x, y, type) {
    this.entity_type = ENTITY_TYPES.ENEMY;

    this.maxHealth = BaseHealth * (1 + (scale / 10));
    this.health = this.maxHealth;
    this.strength = BaseStrength * (1 + (scale / 5));
    this.defense = BaseDefense * (1 + (scale / 8));

    this.dead = false;

    this.x = x;
    this.y = y;
    this.type = type;

    this.cooldown = 0;

    this.range = (this.y < 0 || this.y > 500) ? 999999 : (Math.random() * 400);
  }
  //pathfindPlayer()
  attack(party) {

  }
  update(party) {
    if (this.isDead()) return;

    let atckPlayer = this.moveInDirectionOfPlayerNearby(party.players);
    if (atckPlayer != null) {
      if (this.cooldown > 0) { this.cooldown -= 1; return; }
      this.cooldown = 20;
      atckPlayer.damage(this.strength);
    }
  }
  moveInDirectionOfPlayerNearby(players, awayFromPlayerRange=50) {
    let lowestP;
    let lowestDist = BIG_NUMBER;
    for (let p of players) {
      if (p.isDead()) continue;

      let dt = dist(p, this);
      if (lowestDist > dt) {
        lowestDist = dt;
        lowestP = p;
      }
    }
    if (lowestDist > this.range) return null;
    if (lowestDist <= awayFromPlayerRange) return lowestP;
    let pnts = getShorterLinePoints(this.x, lowestP.x, this.y, lowestP.y, 7);
    this.x = pnts.x;
    this.y = pnts.y;
    return null;
  }
  isDead() {
    this.dead = this.health <= 0;
    return this.dead;
  }
  damage(amount, sustained) {
    if (this.dead) return;
    this.health -= amount;
    this.range = 999999;
    if (sustained) {
      setTimeout(() => {
        this.health -= 1;
        this.isDead()
      }, 1000)
      setTimeout(() => {
        this.health -= 1;
        this.isDead()
      }, 2000)
    }
    return this.isDead();
  }
}

const BIG_NUMBER = 99999999999999999999;

const ITEM_TYPES = {
  WEAPON: "Weapon",
  ONE_USE: "Consumable",
  ABILITY: "Ability Item",
  ARMOR: "Armor"
}

const ATTACK_SPEED = {
  HIGH: -500,
  MEDIUM: 0,
  LOW: 1000
}

var RANDOM_DESC = ["Magical", "Stronk", "Spudish", "Potential", "Crazy", "Advanced", "Insane", "Normal", "Not So Normal", "Totally Normal", "A", "Not A"]
var ITEM_NAME = {
  Rabbi: ["Prayer Book", "Texts", "Debate Records", "Dreidel", "Etrog"],
  Sorcerer: ["Stone", "Orb", "Staff", "Hand", "Charm", "Bane"],
  Soldier: ["Sword", "Shield", "Dagger", "Stick", "Fist"]
}

class Item {
  constructor(name, type, stats, description, requiredClass) {
    /*
    Stats: {
      //Weapon Stats
      attack_damage: ?,
      speed: ?, //maybe

      //Armor
      health_addition: ?,
      defense: ?,

      //Consumable/Ability Item
      onUse: func(player, party),

    }
    */
    this.name = name;
    this.type = type;
    this.stats = stats;
    this.onUse = function() {};
    try {
      this.onUse = stats.onUse;
    } catch (e) {}

    this.desc = description;

    this.requiredClass = requiredClass;
  }
  static randomItem(pclas, lvl) {
    return new Item(
      RANDOM_DESC[Math.floor(Math.random() * RANDOM_DESC.length)] + " " + (ITEM_NAME[pclas])[Math.floor(Math.random() * ITEM_NAME[pclas].length)],
      ITEM_TYPES.WEAPON,
      {
        attack_damage: lvl * (1 + Math.floor(Math.random() * 2)),
        speed: (Math.floor(Math.random() * 3) - 1) * 500,
      },
      "", pclas
    );
  }
  static getBaseItems() {
    return {
      Rabbi: new Item("Prayer Book", ITEM_TYPES.ABILITY_ITEM, {
        attack_damage: 1,
        speed: 0
      }, "A bit of an attack boost.", CLASSES.RABBI),
      Soldier: new Item("Sword", ITEM_TYPES.WEAPON, {
        attack_damage: 2,
        speed: 0
      }, "A weak sword.", CLASSES.SOLDIER),
      Sorcerer: new Item("Magic Stone", ITEM_TYPES.ABILTIY_ITEM, {
        attack_damage: 1,
        speed: ATTACK_SPEED.LOW
      }, "<i>*Magical Noises*</i>", CLASSES.SORCERER)
    }
  }
}

module.exports.Player = Player;
module.exports.Party = Party;
module.exports.Room = Room;
module.exports.Item = Item;
module.exports.TYPES = {
  ITEM_TYPES: ITEM_TYPES,
  CLASSES: CLASSES,
  ENEMY_TYPES: ENEMY_TYPES,
  ATTACK_SPEED_TYPES: ATTACK_SPEED
}
