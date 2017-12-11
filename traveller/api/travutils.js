var TravUtils = TravUtils || (function() {
    'use strict';

    var CheckInstall = function() {
        return true;
    };

    var systemsData = {};
    var tradeSpeculationData = {};

    var loadSystemsData = function(notes) {
        _.each(notes.split("<br>"), function(system) {
            var fields = system.split(/\s+/);
            if (fields.length == 0 || fields[0] == "") {
                return;
            }
            var data = {
                hex: fields[1],
                upp: fields[2],
                starport: fields[2][0],
                size: parseInt(fields[2][1], 16),
                atmo: parseInt(fields[2][2], 16),
                hydro: parseInt(fields[2][3], 16),
                pop: parseInt(fields[2][4], 16),
                gov: parseInt(fields[2][5], 16),
                law: parseInt(fields[2][6], 16),
                tech: parseInt(fields[2][8], 16),
                naval: fields[3].indexOf("N") != -1,
                scout: fields[3].indexOf("S") != -1,
                codes: {},
            }
            if (data['atmo'] >= 4 && data['atmo'] <= 9 && data['hydro'] >= 4 && data['hydro'] <= 8 && data['pop'] >= 5 && data['pop'] <= 7) {
                data['codes']['A'] = true;
            }
            if (data['atmo'] <= 3 && data['pop'] >= 6) {
                data['codes']['NA'] = true;
            }
            if ((data['atmo'] <= 2 || data['atmo'] == 4 || data['atmo'] == 7 || data['atmo'] == 9) && data['pop'] >= 9) {
                data['codes']['I'] = true;
            }
            if (data['pop'] <= 6) {
                data['codes']['NI'] = true;
            }
            if ((data['atmo'] == 6 || data['atmo'] == 8) && data['pop'] >= 6 && data['pop'] <= 8 && data['gov'] >= 4 && data['gov'] <= 9) {
                data['codes']['R'] = true;
            }
            if (data['atmo'] >= 2 && data['atmo'] <= 5 && data['hydro'] <= 3) {
                data['codes']['P'] = true;
            }
            systemsData[fields[0].toLowerCase()] = data;
        });
        log(systemsData);
    };
    var loadTradeSpecData = function(notes) {
        var parseDMs = function(text) {
            var dms = {};
            _.each(text.split(','), function(dmdef) {
                dms[dmdef.slice(0,-2)] = parseInt(dmdef.slice(-2));
            });
            return dms;
        };
        _.each(notes.split("<br>"), function(trade) {
            var fields = trade.split(/\s+/);
            if (fields.length == 0 || fields[0] == "") {
                return;
            }
            var data = {
                name: fields[1],
                price: parseInt(fields[2]),
                purchaseDms: parseDMs(fields[3]),
                saleDms: parseDMs(fields[4]),
                quantity: fields[5],
            }
            tradeSpeculationData[fields[0]] = data;
        });
        log(tradeSpeculationData);
    };
    var loadInitialData = function() {
        var handouts = findObjs({                              
            _type: "handout",
            name: "SystemsData"
        });
        _.each(handouts, function(handout) {
            handout.get("notes", loadSystemsData);
        });
        var handouts = findObjs({                              
            _type: "handout",
            name: "TradeSpeculationData"
        });
        _.each(handouts, function(handout) {
            handout.get("notes", loadTradeSpecData);
        });
    };
  
    var CheckWounds = function(obj) {
        var zeroCount = 0;
        var bars =  ["bar1_value", "bar2_value", "bar3_value"];
        for (var i=0; i<3; i++) {
            var value = Number(obj.get(bars[i]));
            if (value <= 0) {
                zeroCount++;
            }
        }
        obj.set("status_dead", zeroCount > 0);
        if (zeroCount > 0) {
            var turnorder = Campaign().get("turnorder");
            if (turnorder == "") {
                turnorder = [];
            } else {
                turnorder = JSON.parse(turnorder);
            }
            var index = -1;
            for (var i=0; i<turnorder.length; i++) {
                if (turnorder[i]['id'] == obj.get('_id')) {
                    index = i;
                }
            }
            if (index >= 0) {
                turnorder.splice(index, 1);
                Campaign().set("turnorder", JSON.stringify(turnorder));
            }
        }
        return zeroCount;
        
    };

    var FirstBlood = function(msg) {
        var params = msg.content.split(" ");
        
        var token = getObj("graphic", params[1]);
        var damage = Number(params[2]);
        
        var attrs = ["strength", "dexterity", "endurance"];
        var attrIndexes = [0, 1, 2];
        var actions = [];
        
        while (damage > 0 && attrIndexes.length > 0) {
            var index = randomInteger(attrIndexes.length) - 1;
            var attr = attrs[attrIndexes[index]];
            var bar = "bar" + (attrIndexes[index]+1).toString() + "_value";
            var value = Number(token.get(bar));
            if (value > 0) {
                var extra = damage - value;
                if (extra > 0) {
                    actions.push("{{" + attr + "=" + value.toString() + "}}");
                    token.set(bar, "0");
                    damage = damage - value;
                } else {
                    actions.push("{{" + attr + "=" + damage.toString() + "}}");
                    token.set(bar, (value - damage).toString());
                    damage = 0;
                }
            } else {
                actions.push("{{" + attr + "=is 0 skipping}}");
            }
            attrIndexes.splice(index, 1);
        }
        var zeroCount = CheckWounds(token);
        sendChat("First Blood Calculator", "&{template:default} {{name=First blood damage to " + token.get("name") + "}} {{damage=" + params[2] + "}} " + actions.join(" ") + " {{status=" + ["Just fine", "Knocked unconscious", "Seriously wounded", "Dead"][zeroCount] + "}}");
    };

    var Attack = function(msg) {
        var params = msg.content.split(" ");
        
        var attackerT = getObj("graphic", params[1]);
        var attackerC = getObj("character", attackerT.get("represents"));
        var defenderT = getObj("graphic", params[2]);
        var defenderC = getObj("character", defenderT.get("represents"));
    
        var weapon = getAttrByName(attackerC.id, "currentweapon");
        var wounds = getAttrByName(attackerC.id, "Currentweapon_wounds");
        var armormod = getAttrByName(defenderC.id, "armor_" + weapon.toLowerCase());
        if (armormod == "") {
            armormod = "0";
        }
        armormod = armormod + " [ARMOR]";
        var distX = (defenderT.get("left") - attackerT.get("left")) / 70;
        var distY = (defenderT.get("top") - attackerT.get("top")) / 70;
        var dist = (distX * distX) + (distY * distY);
        var range = "Out of Range";
        var rangemod = "no";
        if (dist == 0) {
            range = "Close";
            rangemod = getAttrByName(attackerC.id, "currentweapon_close");
        } else if (dist < 16) {
            range = "Short";
            rangemod = getAttrByName(attackerC.id, "currentweapon_short");
        } else if (dist < 1156) {
            range = "Medium";
            rangemod = getAttrByName(attackerC.id, "currentweapon_medium");
        } else if (dist < 28001) {
            range = "Long";
            rangemod = getAttrByName(attackerC.id, "currentweapon_long");
        } else if (dist < 111556) {
            range = "Very Long";
            rangemod = getAttrByName(attackerC.id, "currentweapon_verylong");
        }
        if (rangemod == "no") {
            range = "Out of Range";
        }
        var skill = weapon.toLowerCase();
        var skillmod = "0 [NO SKILL MOD]";
        if (skill != "claws" && skill != "teeth" && skill != "horns" && skill != "hooves" && skill != "stinger" && skill != "thrasher") {
            if (skill == "hands" || skill == "club") {
                skill = "brawling";
            }
            if (getAttrByName(attackerC.id, "trained_" + skill) != "1") {
                skillmod = "-5 [UNTRAINED]";
            } else {
                skillmod = getAttrByName(attackerC.id, "skill_" + skill) + " [SKILL MOD]";
            }
        }
        var attr = getAttrByName(attackerC.id, "currentweapon_stat");
        var attrmod = "0 [NO ATTR MOD]";
        if (!(attr == "none" || attr == "" || attr == undefined)) {
            var attrscore = Number(getAttrByName(attackerC.id, attr, "max"));
            if (Number(getAttrByName(attackerC.id, "currentweapon_penaltycutoff")) > attrscore) {
                attrmod = "-" + getAttrByName(attackerC.id, "currentweapon_penaltydm") + " [ATTR PENALTY]";
            } else if (Number(getAttrByName(attackerC.id, "currentweapon_bonuscutoff")) <= attrscore) {
                attrmod = getAttrByName(attackerC.id, "currentweapon_bonusdm") + " [ATTR BONUS]";
            }
        } 
        if (rangemod != "no") {
            sendChat(msg.who, "&{template:default} {{name=" + attackerT.get("name") + " at " + range + " range " + " attacks " + defenderT.get("name") + " with " + weapon + "}} {{attack=[[2d6 + " + rangemod + " [ " + range.toUpperCase() + " RANGE] + " + skillmod + " + " + armormod + " + " + attrmod + " ]]}} {{damage=[[" + wounds + "]]}}");
        } else {
            sendChat(msg.who, "&{template:default} {{name=" + defenderT.get("name") + " is out of range of " + attackerT.get("name") + "'s " + weapon + "}} {{ }} {{ }}")
        }
    };

    var TradeSpecAvailable = function(msg) {
        var actualValues = [0.4, 0.5, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 1.7, 2, 3, 4];
        var params = msg.content.split(" ");
        var systemName = params[1];
        if (systemName.toLowerCase() in systemsData) {
            var system = systemsData[systemName.toLowerCase()];
            var roll1 = randomInteger(6);
            var roll2 = randomInteger(6);
            if (system['pop'] >= 9) {
                roll1 = roll1 + 1;
                if (roll1 > 6) {
                    roll1 = 6;
                }
            } else if (system['pop'] <= 5) {
                roll1 = roll1 -1;
                if (roll1 < 1) {
                    roll1 = 1;
                }
            }
            var tradeItem = tradeSpeculationData[roll1.toString() + roll2.toString()];
            var valueRoll = randomInteger(6) + randomInteger(6);
            log("Value roll: " + valueRoll.toString());
            for (var code in tradeItem['purchaseDms']) {
                if (code in system['codes']) {
                    log("Mod: " + code + " " + tradeItem['purchaseDms'][code].toString());
                    valueRoll = valueRoll + tradeItem['purchaseDms'][code];
                }
            }
            if (valueRoll < 2) {
                valueRoll = 2;
            } else if (valueRoll > 15) {
                valueRoll = 15;
            }
            log("Value roll w/mods: " + valueRoll.toString());
            var price = Math.floor(tradeItem['price'] * actualValues[valueRoll-2]);
            var unitName = 'per ton';
            var suffix = "tons "
            if (roll1 == 5) {
                unitName = 'each';
                suffix = ""
            }
            sendChat("Trade Speculation", "Trade good found in " + systemName + ": [[" + tradeItem['quantity'] + "]] " + suffix + " " + tradeItem['name'] + " at " + price.toString() +"Cr " + unitName);
        } else {
            sendChat("Trade Speculation", "Unknown system: " + systemName);
        }
    };

    var CargoPassengersAvailable = function(msg) {
        var hPsgs = ['-', '-', [1,1,0], [2,2,0], [2,1,0], [2,1,0], [3,2,0], [3,2,0], [3,1,0], [3,1,0], [3,0,0]];
        var mPsgs = ['-', [1,0,-2], [1,0,0], [2,1,0], [2,1,0], [3,2,0], [3,2,0], [3,1,0], [3,1,0], [3,0,0], [4,0,0]];
        var lPsgs = ['-', [2,0,-6], [2,0,0], [2,0,0], [3,1,0], [3,1,0], [3,0,0], [3,0,0], [4,0,0], [5,0,0], [6,0,0]];
        var majCargo = ['-', [1,0,-4], [1,0,-2], [1,0,-1], [1,0,0], [1,0,1], [1,0,2], [1,0,3], [1,0,4], [1,0,5], [1,0,6]];
        var minCargo = ['-', [1,0,-4], [1,0,-1], [1,0,0], [1,0,1], [1,0,2], [1,0,3], [1,0,4], [1,0,5], [1,0,6], [1,0,7]];
        var incCargo = ['-', '-', '-', '-', '-', '-', [1,0,-3], [1,0,-3], [1,0,-2], [1,0,-2], [1,0,0]];
        
        var calcFunc = function(formula, mod) {
            if (formula == '-') {
                return 0;
            }
            var result = 0;
            for (var i=0; i<formula[0]; i++) {
                result = result + randomInteger(6);
            }
            for (var i=0; i<formula[1]; i++) {
                result = result - randomInteger(6);
            }
            result = result + formula[2] + mod;
            if (result < 0) {
                result = 0;
            }
            return result;
        };

        var params = msg.content.split(" ");
        
        if (params[1].toLowerCase() in systemsData) {
            if (params[2].toLowerCase() in systemsData) {
                var systemFrom = systemsData[params[1].toLowerCase()];
                var systemTo = systemsData[params[2].toLowerCase()];
                var mod = systemFrom['tech'] - systemTo['tech'];
                if (systemTo['pop'] <= 4) {
                    mod = mod - 3;
                } else if (systemTo['pop'] >= 8) {
                    mod = mod + 3;
                }
                
                var hp = calcFunc(hPsgs[systemFrom['pop']], mod);
                var mp = calcFunc(mPsgs[systemFrom['pop']], mod);
                var lp = calcFunc(lPsgs[systemFrom['pop']], mod);
                var cargos = [];
                for (var i=0; i<calcFunc(majCargo[systemFrom['pop']], mod); i++) {
                    cargos.push(randomInteger(6)*10);
                }
                for (var i=0; i<calcFunc(minCargo[systemFrom['pop']], mod); i++) {
                    cargos.push(randomInteger(6)*5);
                }
                for (var i=0; i<calcFunc(incCargo[systemFrom['pop']], mod); i++) {
                    cargos.push(randomInteger(6));
                }
                cargos.sort(function (a, b) {return b - a;});
                sendChat("Cargo and Passengers", "Available from " + params[1] + " to " + params[2] + "\nPassengers: " + hp.toString() + " high, " + mp.toString() + " middle, " + lp.toString() + " low.\nCargos: " + cargos.join(", "));
            } else {
                sendChat("Cargo and Passengers", "Unknown system: " + params[2]);
            }
        } else {
            sendChat("Cargo and Passengers", "Unknown system: " + params[1]);
        }
    };

    var StarshipEncounters = function(msg) {
        var encounterTable = {
            "A": ["",   "",   "",   "",   "S",  "A",  "R",  "M*", "Y",  "T",  "R*", "M*", "C*", "T*"],
            "B": ["",   "",   "",   "",   "A",  "S",  "A",  "R*", "M",  "R",  "C*", "Y*", "T*", "C*"],
            "C": ["",   "",   "",   "",   "",   "R",  "A",  "R*", "TP", "T",  "Y",  "A",  "S*", "Y*"],
            "D": ["",   "",   "",   "",   "",   "",   "S",  "SP", "A",  "R",  "M",  "Y",  "TP", ""],
            "E": ["",   "",   "",   "",   "",   "",   "",   "S",  "A",  "TP", "CP", "",   "",   ""],
            "X": ["",   "",   "",   "",   "",   "",   "",   "T",  "TP", "CP", "C",  "",   "",   ""],
        };
        var shipTable = {
            "A": "200-ton Free trader",
            "C": "800-ton Mercenary cruiser",
            "M": "600-ton subsidized liner",
            "R": "400-ton Subsidized Merchant",
            "S": "100-ton Scout courier",
            "T": "400-ton Patrol cruiser",
            "Y": "200-ton Yacht",
        };
        var snallCraft = ["20-ton Launch", "30-ton Ship's Boat", "30-ton Slow Boat", "40-ton Pinnace", "40-ton Slow Pinnace", "50-ton Cutter", "95-ton Shuttle", "10-ton Fighter"];
        var params = msg.content.split(" ");
        if (params[1].toLowerCase() in systemsData) {
            var system = systemsData[params[1].toLowerCase()];
            var roll = randomInteger(6) + randomInteger(6);
            if (system['naval']) {
                roll = roll + 2;
            }
            if (system['scout']) {
                roll = roll + 1;
            }
            var encounter = encounterTable[system['starport']][roll-2];
            if (encounter == "") {
                sendChat(msg.who, "/w gm No enounter at " + params[1]);
            } else {
                var ship = shipTable[encounter[0]];
                if (encounter[1] == "P") {
                    ship = ship + " (Pirate)";
                }
                if (encounter[1] == "*") {
                    roll = randomInteger(6);
                    if (system['naval']) {
                        roll = roll + 1;
                    }
                    if (system['scout']) {
                        roll = roll - 1;
                    }
                    ship = ship + " and " + snallCraft[roll]; 
                }
                sendChat("Starship Encounter", "/w gm Encounter at " + params[1] + ": " + ship)
            }            
        } else {
            sendChat("Starship Encounter", "/w gm Unknown system: " + params[1]);
        }
    };

    var NpcReactions = function(msg) {
        var reactions = ["Violent. Immediate attack.", "Hostile. Attacks on 5+.", "Hostile. Attacks on 8+.", "Hostile. May attack.", "Unreceptive.", "Non-committal.", "Interested.", "Intrigued.", "Responsive.", "Enthusiastic", "Genuinely friendly."];
        var params = msg.content.split(" ");
        var termMod = Number(params[1]);
        var popMod = Number(params[2]);
        var roll = randomInteger(6) + randomInteger(6) + termMod + popMod;
        if (roll < 2) {
            roll = 2;
        } else if (roll > 12) {
            roll = 12;
        }
        var reaction = reactions[roll-2];
        sendChat("NPC Reactions", "/w gm NPC Reactions: " + reaction);
        if (reaction.indexOf("Attacks on ") != -1) {
            sendChat("NPC Reactions", "/w gm [[2d6]]");
        }
        log(reaction);
    };

    var RandomPersonEncounters = function(msg) {
        var encounters = [
            [
                ["Peasants", 1, "", "Clubs and cudgels", ""],
                ["Peasants", 2, "", "Clubs and cudgels", ""],
                ["Workers", 2, "", "Clubs", ""],
                ["Rowdies", 3, "", "Clubs", ""],
                ["Thugs", 2, "", "Daggers", ""],
                ["Riotous mob", 4, "", "Clubs and daggers", ""],
            ],
            [
                ["Soldiers", 2, "", "Rifles and bayonets", "Cloth"],
                ["Soldiers", 2, "Vehicle", "Carbines", "Mesh"],
                ["Police patrol", 1, "Vehicle", "Automatic Pistols", "Cloth"],
                ["Marines", 2, "Vehicle", "Carbines", "Mesh"],
                ["Naval security troops", 3, "Vehicle", "Carbines", ""],
                ["Soldiers on patrol", 2, "Vehicle", "SMGs", "Jack"],
            ],
            [
                ["Adventurers", 1, "", "Swords", ""],
                ["Noble with retinue", 2, "", "Foils", ""],
                ["Hunters and guides", 2, "", "Rifles and spears", "Jack"],
                ["Tourists", 2, "Vehicle", "Cameras", ""],
                ["Researchers", 2, "Vehicle", "", ""],
                ["Police patrol", 1, "Vehicle", "Revolvers", ""],
            ],
            [
                ["Fugitives", 1, "", "Clubs", ""],
                ["Fugitives", 2, "Vehicle", "Blades", "Jack"],
                ["Fugitives", 3, "", "Revolvers", "Jack"],
                ["Vigilantes", 2, "Vehicle", "Rifles and carbines", "Jack"],
                ["Bandits", 3, "", "Swords and pistols", ""],
                ["Ambushing brigands", 3, "", "Broadswords and pistols", "Cloth"],
            ],
            [
                ["Merchant and employees", 1, "", "Daggers", ""],
                ["Traders", 2, "Vehicle", "Blades", "="],
                ["Religious group", 2, "", "", "="],
                ["Beggars", 1, "Vehicle", "", ""],
                ["Pilgrims", 5, "", "", "Jack"],
                ["Guards", 3, "", "Halberds and daggers", "Jack"],
            ],
        ];
        var additionalWeapons = [
            ["Laser rifle", "Auto rifle", "-", "-", "-", "-"],
            ["Shotgun", "Carbine", "Revolver", "-", "-", "-"],
            ["Broadsword", "Sword", "Halberd", "Cutlass", "Foil", ""],
        ];
        var die1 = randomInteger(6);
        var die2 = randomInteger(6);
        if (die1 == 6) {
            sendChat("Random Person Encounter", "/w gm encounter roll special " + die1.toString() + die2.toString());
        } else {
            var encounter = encounters[die1-1][die2-1];
            var number = 0;
            for (var i=0; i<encounter[1]; i++) {
                number = number + randomInteger(6);
            }
            var vehicle = "";
            if (encounter[2] == "Vehicle") {
                vehicle = " with a vehicle";
            }
            var weapons = "";
            if (encounter[3] != "") {
                weapons = " armed with " + encounter[3];
            }
            var addWeapon = "-";
            for (var i=0; i<additionalWeapons.length && addWeapon == "-"; i++) {
                addWeapon = additionalWeapons[i][randomInteger(6)-1];
            }
            if (addWeapon != "") {
                if (weapons != "") {
                    weapons = weapons + " and";
                }
                weapons  = weapons + " one armed with " + addWeapon;
            }
            sendChat("Random Person Encounter", "/w gm [[" + encounter[1] + "d6]] " + encounter[0] + vehicle + weapons);
        }
        
    };

    var RegisterEvents = function() {
        on("change:graphic:bar1_value", function(obj, prev) {
            CheckWounds(obj);
        });
        on("change:graphic:bar2_value", function(obj, prev) {
            CheckWounds(obj);
        });
        on("change:graphic:bar3_value", function(obj, prev) {
            CheckWounds(obj);
        });
        
        on("change:handout:notes", function(obj, prev) {
            if (obj.get("name") == "TradeSpeculationData") {
                obj.get("notes", loadTradeSpecData);   
            } else if (obj.get("name") == "SystemsData") {
                obj.get("notes", loadSystemsData);        
            }
        });
        
        on("chat:message", function(msg) {
            // Exit if not an api command
            if (msg.type != "api") {
                return;
            }
        
            if (msg.content.indexOf('!attack_token') != -1) {
                Attack(msg);
            } else if (msg.content.indexOf('!first_blood') != -1) {
                FirstBlood(msg);
            } else if (msg.content.indexOf('!starship_encounter') != -1) {
                StarshipEncounters(msg);
            } else if (msg.content.indexOf('!tradespec_available') != -1) {
                TradeSpecAvailable(msg);
            } else if (msg.content.indexOf('!cargo_available') != -1) {
                CargoPassengersAvailable(msg);
            } else if (msg.content.indexOf("!npc_reaction") != -1) {
                NpcReactions(msg);
            } else if (msg.content.indexOf("!random_person_encounter") != -1 ) {
                RandomPersonEncounters(msg);
            }
        });        
    };
    
    return {
        CheckInstall: CheckInstall,
        RegisterEvents: RegisterEvents,
        loadInitialData: loadInitialData,
        NpcReactions: NpcReactions,
        RandomPersonEncounters: RandomPersonEncounters,
    };
}());



on("ready",function(){
    'use strict';
    TravUtils.CheckInstall();
    TravUtils.RegisterEvents();
    TravUtils.loadInitialData();
});
