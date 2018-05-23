on("ready",function(){
    'use strict';

    var CheckInstall = function() {
        if( ! state.travutils ) {
            state.travutils = {
                'version': 1.0,
                'UTPs': {},
            };
            state.travutils.UTPs["Determination"] = {name: "Determination",
                difficulty: "Difficult",
                skillstat1: "endurance",
                skillstat2: "intelligence",
                timenumber: "0",
                timeunit: "",
                hazardous: 0,
                hidden: 0,
            };
        }
    }
    
    var Attributes = {
         strength: "Strength",
         dexterity: "Dexterity",
         endurance: "Endurance",
         intelligence: "Intelligence",
         education: "Education",
         social: "Social",
    };
    var Skills = {
        admin: "Admin",
        bribery: "Bribery",
        computer: "Computer",
        electronics: "Electronics",
        engineering: "Engineering",
        forgery: "Forgery",
        orwardobserver: "Forward Observer",
        gambling: "Gambling",
        gunnery: "Gunnery",
        jackofalltrades: "Jack-of-all-Trades",
        leader: "Leader",
        mechanical: "Mechanical",
        medical: "Medical",
        navigation: "Navigation",
        pilot: "Pilot",
        shipsboat: "Ship's Boat",
        steward: "Steward",
        streetwise: "Streetwise",
        tactics: "Tactics",
        vaccsuit: "Vacc Suit",
        brawling: "Brawling",
        dagger: "Dagger",
        blade: "Blade",
        foil: "Foil",
        cutlass: "Cutlass",
        sword: "Sword",
        broadsword: "Broadsword",
        bayonet: "Bayonet",
        spear: "Spear",
        halberd: "Halberd",
        ike: "Pike",
        cudgel: "Cudgel",
        bodypistol: "Body Pistol",
        automaticpistol: "Automatic Pistol",
        revolver: "Revolver",
        carbine: "Carbine",
        rifle: "Rifle",
        automaticrifle: "Automatic Rifle",
        shotgun: "Shotgun",
        submachinegun: "SMG",
        lasercarbine: "Laser Carbine",
        laserrifle: "Laser Rifle",
        airraft: "Air/Raft",
        atv: "ATV",
        groundcar: "Ground Car",
        sailboat: "Sail Boat",
        motorboat: "Motor Boat",
        submersible: "Submersible",
        fixedwingaircraft: "Fixed Wing Aircraft",
        helicopter: "Helicopter",
        hovercraft: "Hovercraft",
        gravbelt: "Grav Belt",
    };
    var AttrSkills = Object.assign({none:'None'}, Attributes, Skills);
    

    var systemsData = {};
    var systemsPlayersKnow = {};
    var tradeSpeculationData = {};
    var tradeSpeculationDataByName = {};

    var loadSystemsPlayersKnow = function(notes) {
        _.each(notes.split("<br>"), function(system) {
            systemsPlayersKnow[system.replace( /^\s+|\s+$/g, '' ).toLowerCase()] = 1;
        });
        delete systemsPlayersKnow[""];
        log(systemsPlayersKnow);
    };
    
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
                name: fields[0],
                neighbours: [],
                column: parseInt(fields[1].slice(0,2)),
                row: parseInt(fields[1].slice(2,4)),
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
        _.each(systemsData, function(system) {
            system['neighbours'] = _.map(_.filter(systemsData, function(other) {
                return (system.name != other.name) && (Math.abs(system.column - other.column) <= 4) &&  (Math.abs(system.row - other.row) <= 4);
            }), function(s) {return s.name;});
            system['neighbours'].sort();
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
            tradeSpeculationDataByName[fields[1]] = data;
        });
        log(tradeSpeculationDataByName);
    };
    var loadInitialData = function() {
        var handouts = findObjs({                              
            _type: "handout",
            name: "SystemsData"
        });
        _.each(handouts, function(handout) {
            handout.get("notes", loadSystemsData);
            handout.get("gmnotes", loadSystemsPlayersKnow);        
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
        var armormod = getAttrByName(defenderC.id, "armor_" + weapon.replace(' ', '').toLowerCase());
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
        var skill = weapon.replace(' ', '').toLowerCase();
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

    var _planetInfoData = {
        'starport': {  "A": "A: Excellent, refined fuel, annual maintenance, starship construction",
                        "B": "B: Good, refined fuel, annual maintenance, non-starship construction",
                        "C": "C: Routine, unrefined fuel, repair facilities",
                        "D": "D: Poor, unrefined fuel, no repair facilities",
                        "E": "E: Frontier, Marked spot of bedrock, no fuel ot facitities",
                        "X": "X: No starport",
                    },
        'size': {   0: "Asteroid/Planetoid belt",
                    1: "Small: 1000 miles, 10% G",
                    2: "Small: 2000 miles, 25% G",
                    3: "Small: 3000 miles, 40% G",
                    4: "Small: 4000 miles, 50% G",
                    5: "Medium: 5000 miles, 65% G",
                    6: "Medium: 6000 miles, 85% G",
                    7: "Medium: 7000 miles, 90% G",
                    8: "Medium: 8000 miles, 100% G",
                    9: "Large: 9000 miles, 110% G",
                    10: "Large: 10000 miles, 125% G",
                },
        'atmosphere': { 0: "0, None: vacc suits needed",
                        1: "1, Trace: vacc suits needed",
                        2: "2, Very thin, tainted: compressor and filter masks needed",
                        3: "3, Very thin: compressor masks needed",
                        4: "4, Thin, tainted: filter masks needed",
                        5: "5, Thin: breathable",
                        6: "6, Standard: breathable",
                        7: "7, Standard, tainted: filter masks needed",
                        8: "8, Dense: breathable",
                        9: "9, Dense, tainted: filter masks needed",
                        10: "10, Exotic: oxygen tanks needed",
                        11: "11, Corrosive: protective/vacc suits needed",
                        12: "12, Insidious: protective/vacc suits needed",
                    },
        'population': { 0: "None",
                        1: "Tens",
                        2: "Hundreds",
                        3: "Thousands",
                        4: "Tens of thousands",
                        5: "Hundreds of thousands",
                        6: "Millions",
                        7: "Tens of millions",
                        8: "Hundreds of millions",
                        9: "Billions",
                        10: "Tens of billions",
                    },
        'government': { 0: "0: None",
                        1: "1: Company/Corporation",
                        2: "2: Participating Democracy",
                        3: "3: Self-Perpetuating Oligarchy",
                        4: "4: Representative Democracy",
                        5: "5: Feudal Technocracy",
                        6: "6: Captive",
                        7: "7: Balkanization",
                        8: "8: Civil Service Bureaucracy",
                        9: "9: Impersonal Bureaucracy",
                        10: "10: Charasmatic Dictator",
                        11: "11: Non-Charasmatic Dictator",
                        12: "12: Charismatic Oligarchy",
                        13: "13: Relgious Dictatorship",
                    },
        'law': {    0: "0: No prohibitions",
                    1: "1: Body pistols, explosives, and poison gas prohibited",
                    2: "2: Portable energy weapons, Body pistols, explosives, and poison gas prohibited",
                    3: "3: Automatic Rifles, Portable energy weapons, Body pistols, explosives, and poison gas prohibited",
                    4: "4: SMGs, Automatic Rifles, Portable energy weapons, Body pistols, explosives, and poison gas prohibited",
                    5: "5: Pistols, Revolvers, SMGs, Automatic Rifles, Portable energy weapons, Body pistols, explosives, and poison gas prohibited",
                    6: "6: Frearms other than shotguns prohibited",
                    7: "7: All firearms prohibited",
                    8: "8: All firearms and all blades other than daggers prohibited",
                    9: "9: All weapons prohibited",
                },
               
    };
    var PlanetInfo = function(msg) {
        var params = msg.content.split(" ");
        var systemName = params[1];
        var isGm = playerIsGM(msg.playerid);
        log(isGm);
        
        if (!(isGm || systemName.toLowerCase() in systemsPlayersKnow)) {
            sendChat("Planet Info", "You don't know much about: " + systemName);
            return;
        }
        if (systemName.toLowerCase() in systemsData) {
            var data = systemsData[systemName.toLowerCase()];
            var name = data['name'];
            var upp = data['upp'];
            if (data['naval']) {
                upp = upp + ' Naval';
            }
            if (data['scout']) {
                upp = upp + ' Scout';
            }
            log(data['gov']);
            log(_planetInfoData['government']);
            log(data['size']);
            log(_planetInfoData['size']);
            var starport = _planetInfoData['starport'][data['starport']];
            var size = _planetInfoData['size'][data['size']];
            var atmo = _planetInfoData['atmosphere'][data['atmo']];
            var hydro = (data['hydro']*10).toString() + "%";
            var pop = _planetInfoData['population'][data['pop']];
            var gov = _planetInfoData['government'][data['gov']];
            var law = _planetInfoData['law'][data['law']];
            var tech = data['tech'].toString();
            var codes = [];
            for (var k in data['codes']) {
                codes.push(k);
            }
            if (data['law'] > 9) {
                law = ">9: All weapons prohibited";
            }
            var msgStart = "&{template:default} {{name=" + name + "}} ";
            if (playerIsGM(msg.playerid)) {
                msgStart = "/w gm " + msgStart;
            }
            var tradeSpec = Object.keys(tradeSpeculationDataByName);
            tradeSpec.sort()
            tradeSpec = tradeSpec.join("|");
            sendChat("Planet Info", msgStart +
                        "{{UPP=" + upp + "}}" +
                        "{{Starport=" + starport + "}} " +
                        "{{Size=" + size + "}} " +
                        "{{Atmosphere=" + atmo + "}} " +
                        "{{Hydrophere=" + hydro + "}} " +
                        "{{Population=" + pop + "}} " +
                        "{{Government=" + gov + "}} " +
                        "{{Law Level=" + law + "}} " +
                        "{{Tech Level=" + tech + "}} " +
                        "{{Codes=" + codes.join(" ") + "}} " +
                        "{{Buttons=" + systemButtons(systemName.toLowerCase(), tradeSpec, isGm) + "}} ",
                    null, {noarchive:true}
                );
        } else {
            sendChat("Planet Info", "/w " + msg.who + " Unknown system: " + systemName, null, {noarchive:true});
        }
    };
    
    var sellTradeSpec = function(msg) {
        var actualValues = [0.4, 0.5, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 1.7, 2, 3, 4];
        var params = msg.content.split(" ");
        var character = getObj("character", params[1]);
        if (! character) {
            character = getObj("character", getObj("graphic", params[1]).get("represents"));
        }
        var systemName = params[2];
        var tradeItemName = params[3];
        var brokerDm = parseInt(params[4]);
        if (!(tradeItemName in tradeSpeculationDataByName)) {
            sendChat("Trade Speculation", "Unknown trade item: " + tradeItemName);
            return;
        }
        if (systemName.toLowerCase() in systemsData) {
            var system = systemsData[systemName.toLowerCase()];
            var tradeItem = tradeSpeculationDataByName[tradeItemName];
            var valueRoll = randomInteger(6) + randomInteger(6);
            systemName = system["name"];
            log("Value roll: " + valueRoll.toString());
            for (var code in tradeItem['purchaseDms']) {
                if (code in system['codes']) {
                    log("Mod: " + code + " " + tradeItem['purchaseDms'][code].toString());
                    valueRoll = valueRoll + tradeItem['purchaseDms'][code];
                }
            }
            valueRoll = valueRoll + brokerDm;
            log("Mod: broker " + brokerDm.toString());
            if (character) {
                var charMod = 0;
                var charSkill = '';
                if (getAttrByName(character.id, "trained_admin") != "1") {
                    var adminSkill = parseInt(getAttrByName(character.id, "skill_admin"));
                    if (adminSkill > charMod) {
                        charMod = adminSkill;
                        charSkill = 'Admin';
                    }
                }
                if (getAttrByName(character.id, "trained_bribery") != "1") {
                    var briberySkill = parseInt(getAttrByName(character.id, "skill_bribery"));
                    if (briberySkill > charMod) {
                        charMod = briberySkill;
                        charSkill = 'Bribery';
                    }
                }
                if (charMod > 1) {
                    valueRoll = valueRoll + charMod;
                    log("Mod: " + charSkill + " skill " + charMod.toString());
                } else {
                    log("No relevant character skill");
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
            if (_.contains(["Aircraft", "Air/raft", "Computers", "All-Terrain-Vehicles", "Armored-Vehicles", "Farm-Machinery"], tradeItemName)) {
                unitName = 'each';
                suffix = ""
            }
            var brokerComm = "None";
            if (brokerDm > 0) {
                brokerComm = (brokerDm*5).toString() + "% is " + ((price*brokerDm)/20).toString() + "Cr " + unitName;
            }
            sendChat("Trade Speculation", "&{template:default} {{name=Best Trade Speculation Offer in " + systemName + "}}" +
                                                              "{{Goods=" + tradeItemName + "}}" +
                                                              "{{Price=" + price.toString() + "Cr " + unitName + "}}" +
                                                              "{{Broker=" + brokerComm + "}}" + 
                                                              "{{Base=" + tradeItem['price'].toString() + "Cr " + unitName + "}}" );
        } else {
            sendChat("Trade Speculation", "\w " + msg.who + " Unknown system: " + systemName);
        }
    };
    
    var TradeSpecAvailable = function(msg) {
        var actualValues = [0.4, 0.5, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 1.7, 2, 3, 4];
        var params = msg.content.split(" ");
        var systemName = params[1];
        if (systemName.toLowerCase() in systemsData) {
            var system = systemsData[systemName.toLowerCase()];
            systemName = system["name"];
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
            sendChat("Trade Speculation", "&{template:default} {{name=Best Trade Goods in " + systemName + "}}" +
                                                              "{{Goods=" + tradeItem['name'] + "}}" +
                                                              "{{Price=" + price.toString() + "Cr " + unitName + "}}" +
                                                              "{{Quantity=[[" + tradeItem['quantity'] + "]] " + suffix + "}}" + 
                                                              "{{Base=" + tradeItem['price'].toString() + "Cr " + unitName + "}}" );
        } else {
            sendChat("Trade Speculation", "\w " + msg.who + " Unknown system: " + systemName);
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
                if (cargos.length == 0) {
                    cargos.push(0);
                }
                sendChat("Cargo and Passengers", "&{template:default} {{name=Available from " + systemFrom["name"] + " to " + systemTo["name"] + "}}" +
                                                                     "{{Cargo=" + cargos.join(", ") + "}}" +
                                                                     "{{High=" + hp.toString() + "}}" +
                                                                     "{{Middle=" + mp.toString() + "}}" +
                                                                     "{{Low=" + lp.toString() + "}}");
            } else {
                sendChat("Cargo and Passengers", "\w " + msg.who + " Unknown system: " + systemTo["name"]);
            }
        } else {
            sendChat("Cargo and Passengers", "\w " + msg.who + " Unknown system: " + systemFrom["name"]);
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
                sendChat(msg.who, "/w gm &{template:default} {{name=No enounter at " + system.name + "}}");
            } else {
                var ship = shipTable[encounter[0]];
                var smallShip = "None";
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
                    smallShip = snallCraft[roll]; 
                }
                sendChat("Starship Encounter", "/w gm ")
                sendChat("Starship Encounter", "/w gm &{template:default} " +
                    "{{name=Starship Encounter at " + system.name + "}} " +
                    "{{Ship=" + ship + "}} " +
                    "{{Small craft=" + smallShip + "}}");
            }            
        } else {
            sendChat("Starship Encounter", "/w gm Unknown system: " + params[1], null, {noarchive:true});
        }
    };

    var NpcReactions = function(msg) {
        var reactions = ["Violent. Immediate attack.", "Hostile. Attacks on 5+.", "Hostile. Attacks on 8+.", "Hostile. May attack.", "Unreceptive.", "Non-committal.", "Interested.", "Intrigued.", "Responsive.", "Enthusiastic", "Genuinely friendly."];
        var params = msg.content.split(" ");
        var termMod = Number(params[1]);
        var popMod = 0;
        if (params[2].toLowerCase() in systemsData) {
            if (systemsData[params[2].toLowerCase()].pop >= 9) {
                popMod = -1;
            }
        }
        var roll = randomInteger(6) + randomInteger(6) + termMod + popMod;
        if (roll < 2) {
            roll = 2;
        } else if (roll > 12) {
            roll = 12;
        }
        var reaction = reactions[roll-2];
        var attacksOn = "";
        if (reaction.indexOf("Attacks on ") != -1) {
            attacksOn = "{{Attacks on=[[2d6]]}}";
        }
        sendChat("NPC Reactions", "/w gm &{template:default} {{name=NPC Reactions}} {{reaction=" + reaction + " (" + roll.toString() +")}} " + attacksOn);
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
            sendChat("Random Person Encounter", "/w gm &{template:default} {{name=Encounter}} {{Type=encounter roll special " + die1.toString() + die2.toString() + "}}");
        } else {
            var encounter = encounters[die1-1][die2-1];
            var vehicle = "";
            if (encounter[2] == "Vehicle") {
                vehicle = " with a vehicle";
            }
            var weapons = "None";
            if (encounter[3] != "") {
                weapons = encounter[3];
            }
            var addWeapon = "-";
            for (var i=0; i<additionalWeapons.length && addWeapon == "-"; i++) {
               addWeapon = additionalWeapons[i][randomInteger(6)-1];
            }
            if (addWeapon == "-") {
                addWeapon = "None";
            }

            sendChat("Random Person Encounter", "/w gm &{template:default} {{name=Encounter}} " +
                        "{{Type=" + encounter[0] + vehicle + "}} " +
                        "{{Number=[[" + encounter[1] + "d6]]}} " +
                        "{{Weapons=" + encounter[3] + "}} " +
                        "{{Additional Weapon=" + addWeapon + "}}");
        }
        
    };
    
    var UTP_Create = function(msg) {
        var params = msg.content.split(" ");
        var name = params[1];
        if (name in state.travutils.UTPs) {
            sendChat("UTP", "/w " + msg.who + "Already a UTP named " + name, null, {noarchive:true})
        } else {
            state.travutils.UTPs[name] = {name: name,
                difficulty: params[2],
                skillstat1: params[3],
                skillstat2: params[4],
                timenumber: params[5],
                timeunit: params[6],
                hazardous: Number(params[7]),
                hidden: 0,
            }
            sendChat("UTP", "/w " + msg.who + "Created a UTP named " + name, null, {noarchive:true});
            UTP_List(msg);
        }
    };
    
    var UTP_List = function(msg, hidden=0) {
        var isGm = playerIsGM(msg.playerid);
        var gmroll = "";
        if (isGm) {
            var skillList = _.map(Attributes, function(v,k) {return v+","+k;}).join("|") + "|" + _.map(Skills, function(v,k) {return v+","+k;}).join("|");
            gmroll = "{{[Create New](!travutil_utp_create &#63;{Name} &#63;{Difficulty|Simple|Routine|Difficult|Formidable} " +
                "&#63;{Skill 1|None,none|" + skillList + "} &#63;{Skill 2|None,none|" + skillList + "} &#63;{Time Number|0} &#63;{Time Unit|Minutes} " +
                "&#63;{Hazardous|Yes,1|No,0})=}} "
        }
        sendChat("UTP", "/w " + msg.who + "&{template:default} {{name=" + (hidden?"Hidden ":"") + "Tasks}} " + gmroll + 
            _.map(_.where(state.travutils.UTPs, {hidden: hidden}), function(t) {return "{{[" + t.name + "](!travutil_utp_show " + t.name + ")=}}";}).join(" "),
            null, {noarchive:true});
    }
    
    var UTP_Show = function(msg) {
        var params = msg.content.split(" ");
        var name = params[1];
        var isGm = playerIsGM(msg.playerid);
        if (name in state.travutils.UTPs) {
            var task = state.travutils.UTPs[name];
            var rows = ["{{Difficulty=" + task.difficulty + "}}",
                        "{{SKill/Stat=" + AttrSkills[task.skillstat1] + " and " + AttrSkills[task.skillstat2] + "}}",
                        "{{Time Unit=" + task.timenumber + " " + task.timeunit + "}}",
                        "{{Hazardous=" +(task.hazardous?"Yes":"No")  + "}}",
                        ];
            if (!isGm) {
                rows.push("{{Action=[Roll](!travutil_utp_roll &#64;{selected|token_id} " + task.name + ")}}");
            } else {
                rows.push("{{Hidden=" + (task.hidden?"Yes":"No") + "}}");
                rows.push("{{Action=[Roll](!travutil_utp_roll &#64;{selected|token_id} " + task.name + ") " +
                          "[Delete](!travutil_utp_delete " + task.name + ") " +
                          "[Toggle Hide](!travutil_utp_toggle_hide " + task.name + ")}}");
            }
            log(rows);
            sendChat("UTP", "/w " + msg.who + "&{template:default} {{name=UTP: " + task.name + "}}" + rows.join(" "),  null, {noarchive:true});
        } else {
            sendChat("UTP", "/w " + msg.who + "No UTP named " + name, null, {noarchive:true})
        }
        
    };
    
    var UTP_Toggle_Hide = function(msg) {
        var params = msg.content.split(" ");
        var name = params[1];
        var isGm = playerIsGM(msg.playerid);
        if (name in state.travutils.UTPs) {
            if (isGm) {
                state.travutils.UTPs[name].hidden = state.travutils.UTPs[name].hidden?0:1;
                sendChat("UTP", "/w " + msg.who + "UTP Hidden Toggled: " + name, null, {noarchive:true});
                UTP_List(msg, state.travutils.UTPs[name].hidden?0:1);
            }
        } else {
            sendChat("UTP", "/w " + msg.who + "No UTP named " + name, null, {noarchive:true})
        }        
    }

    var UTP_Delete = function(msg) {
        var params = msg.content.split(" ");
        var name = params[1];
        var isGm = playerIsGM(msg.playerid);
        if (name == 'Determination') {
            sendChat("UTP", "/w " + msg.who + "Will not delete Determination metatask", null, {noarchive:true});
        } else if (name in state.travutils.UTPs) {
            if (isGm) {
                delete state.travutils.UTPs[name];
                sendChat("UTP", "/w " + msg.who + "UTP deleted: " + name, null, {noarchive:true});
                UTP_List(msg);
            }
        } else {
            sendChat("UTP", "/w " + msg.who + "No UTP named " + name, null, {noarchive:true})
        }
    };
    
    var UTP_Roll = function(msg) {
        var params = msg.content.split(" ");
        log(params);
        var character = getObj("character", params[1]);
        if (! character) {
            character = getObj("character", getObj("graphic", params[1]).get("represents"));
        }
        var name = params[2];
        if (name in state.travutils.UTPs) {
            var task = state.travutils.UTPs[name];
            log(params);
            log(task);
            log(character);
            var createMod = function(attrskill) {
                if (attrskill in Attributes) {
                    return " + " + Math.floor(Number(getAttrByName(character.id, attrskill)) / 5).toString() + " ["+Attributes[attrskill]+"]";
                } else if (attrskill in Skills) {
                    if (getAttrByName(character.id, "trained_" + attrskill) != "1") {
                        if (getAttrByName(character.id, "trained_jackofalltrades") != "1") {
                            return " - 4 [UNTRAINED in " + Skills[attrskill] + "]";
                        } else {
                            return  " + 0 [JoT for " + Skills[attrskill] + "]";
                        }
                    } else {
                        return " + " + getAttrByName(character.id, "skill_" + attrskill) + " [" + Skills[attrskill] + "]";
                    }
                } else {
                    return "";
                }
            };
            var speed = Number(params[3]);
            var mods = createMod(task.skillstat1) +  createMod(task.skillstat2);
            
            var rows = [
                "{{Difficulty=" + task.difficulty + "}}",
                "{{SKill/Stat=" + AttrSkills[task.skillstat1] + " and " + AttrSkills[task.skillstat2] + "}}",
                "{{Hazardous=" +(task.hazardous?"Yes":"No")  + "}}",
                "{{Roll=[[ [UTPROLL:" + task.name + "] 2d6 " + mods + " ]]}}",
                "{{Time=[[(3d6 " + mods.replace(/-/g, 'MINUS').replace(/\+/g, '-').replace(/MINUS/g, '+') + ")* " + task.timenumber + "]] " + task.timeunit + "}}",
               ];
            sendChat("UTP", "&{template:default} {{name=UTP Roll: " + task.name + " for " + character.get("name")  + "}}" + rows.join(" "));
        } else {
            sendChat("UTP", "/w " + msg.who + "No UTP named " + name, null, {noarchive:true})
        }
    };
    
    var UTP_Roll_Scanner = function(msg) {
        var rolls = msg.inlinerolls;
        if (rolls) {
            let UTPRoll_re = /\[UTPROLL:(\S+)\]/;
            let UTPFail_re = /\[UTPFAILROLL:(\S+)\]/;
            let UTPMISHAP_re = /\[UTPMISSHAPROLL:(\S+)\]/;
            _.each(rolls, function(roll) {
                let expr = roll["expression"];
                if (expr) {
                    let match = UTPRoll_re.exec(expr);
                    if (match) {
                        if (match[1] in state.travutils.UTPs ) {
                            let result = roll["results"]["total"];
                            let task = state.travutils.UTPs[match[1]];
                            let required = {simple: 3, routine:7, difficult:11, formidable:15}[task.difficulty.toLowerCase()];
                            if (result < required) {
                                let failRoll = "2d6";
                                if (task.hazardous) {
                                    failRoll = "3d6";
                                }
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Roll Monitor}} {{Task=" + match[1] + "}} {{Outcome=Failure}} {{Failure Roll=[[ [UTPFAILROLL:" + match[1] + "] " + failRoll + "]]}}");
                            } else {
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Roll Monitor}} {{Task=" + match[1] + "}} {{Outcome=Success}}");
                            }
                        } else {
                            log("UTP Roll Scanner unable to find UTP with name " + match[1]);
                        }
                    }
                    match = UTPFail_re.exec(expr);
                    if (match) {
                        if (match[1] in state.travutils.UTPs ) {
                            let result = roll["results"]["total"];
                            let task = state.travutils.UTPs[match[1]];
                            if (result >= 11) {
                                let mishap = "2d6";
                                if (result >= 15) {
                                    mishap = "3d6";
                                }
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Roll Failure Monitor}} {{Task=" + match[1] + "}} {{Outcome=Mishap}} {{Mishap Roll=[[ [UTPMISSHAPROLL:" + match[1] + "]" + mishap + "]]}}")
                            } else if (result >= 7) {
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Roll Failure Monitor}} {{Task=" + match[1] + "}} {{Outcome=[Check Determination](!travutil_utp_roll &#64;{selected|token_id} Determination)}}");
                            } else {
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Roll Failure Monitor}} {{Task=" + match[1] + "}} {{Outcome=May retry}}")
                            }
                        } else {
                            log("UTP Roll Scanner unable to find UTP with name " + match[1]);
                        }
                    }
                    match = UTPMISHAP_re.exec(expr);
                    if (match) {
                        if (match[1] in state.travutils.UTPs ) {
                            let result = roll["results"]["total"];
                            let task = state.travutils.UTPs[match[1]];
                            if (result >= 15) {
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Mishap Monitor}} {{Task="  + match[1] + "}} {{Outcome=Destroyed}} {{Wounds=[[4d6]]}} {{Operation=No}} {{Repair Task=Formidable}} {{Repair Cost=[[2d6 * 2d6 * 5]]% of new price}}");
                            } else if (result >= 11) {
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Mishap Monitor}} {{Task="  + match[1] + "}} {{Outcome=Major Damage}} {{Wounds=[[3d6]]}} {{Operation=No}} {{Repair Task=Difficult}} {{Repair Cost=[[2d6 * 5]]% of new price}}");
                            } else if (result >= 7) {
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Mishap Monitor}} {{Task="  + match[1] + "}} {{Outcome=Minor Damage}} {{Wounds=[[2d6]]}} {{Operation=No}} {{Repair Task=Routine}} {{Repair Cost=[[1d6 * 1d6]]% of new price}}");
                            } else {
                                sendChat("UTP Monitor", "&{template:default} {{name=UTP Mishap Monitor}} {{Task="  + match[1] + "}} {{Outcome=Superficial Damage}} {{Wounds=[[1d6]]}} {{Operation=Yes}} {{Repair Task=Simple}} {{Repair Cost=[[1d6]]% of new price}}");
                            }
                        } else {
                            log("UTP Roll Scanner unable to find UTP with name " + match[1]);
                        }
                    }
                }
            });
        }
    };
    
    
    var LowRevivals = function(msg) {
        var params = msg.content.split(" ");
        var character = getObj("character", params[1]);
        if (! character) {
            character = getObj("character", getObj("graphic", params[1]).get("represents"));
        }
        var count = Number(params[2]);
        var medbonus = "";
        if (getAttrByName(character.id, "trained_medical") == "1" && Number(getAttrByName(character.id, "skill_medical")) >= 2) {
            medbonus = "+1";
        }
        var rolls = [];
        for (var i=0; i<count; i++) {
            rolls.push("2d6" + medbonus);
        }
        if (rolls.length == 0) {
            rolls = "0"
        } else {
            rolls = "[[{" + rolls.join(",") + "}>5]]"
        }
        sendChat("Low Revivals", "&{template:default} {{name=Low Revivals}} " +
                                    "{{Medic=" + character.get('name') + "}} " +
                                    "{{Popsicles=" + count.toString() + "}} " +
                                    "{{Successes=" + rolls + "}} ");
           
    };

    var systemButtons = function(system, tradeSpec, isGm) {
            var buttons = [];
            buttons.push("[Cargo](!travutil_cargo_available " + system + " &#63;{Destination|" + systemsData[system].neighbours.join("|") + "})");
            buttons.push("[Spec-Look](!travutil_tradespec_available " + system + ")");
            buttons.push("[Spec-Sell](!travutil_tradespec_sell &#64;{selected|token_id} " + system + " &#63;{Trade Goods|" + tradeSpec + "} &#63;{Broker DM|0|1|2|3|4})");
            if (isGm) {
                buttons.push("[Ship Encounter](!travutil_starship_encounter " + system + ")");
                buttons.push("[NPC Reaction](!travutil_npc_reaction &#63;{Mod +1 for 5 terms, bribery,admin|0} " + system + ")");
            }
            log(buttons);
            return buttons.join(" ");
    };
    
    var systemListMenu = function(msg) {
        var systems = null;
        var isGm = playerIsGM(msg.playerid);
        if (isGm) {
            systems = Object.keys(systemsData);
        } else {
            systems = Object.keys(systemsPlayersKnow);
        }
        systems.sort();

        var tradeSpec = Object.keys(tradeSpeculationDataByName);
        tradeSpec.sort()
        tradeSpec = tradeSpec.join("|");
        sendChat("System Data", "\w " + msg.who + "&{template:default} {{name=System Menu}}" +
            _.map(systems, function(s) {return "{{[" + systemsData[s].name + "](!travutil_planet_info " + s + ")=}}"}).join(" "),
            null, {noarchive:true});
    };
    
    var mainMenu = function(msg) {
        var isGm = playerIsGM(msg.playerid);
        var buttons = [];
        buttons.push("{{[System List](!travutil_system_list_menu)=}}");
        buttons.push("{{[Low Revivals](!travutil_low_revivals &#64;{selected|token_id} &#63;{Number|0})=}}");
        buttons.push("{{[First Blood](!travutil_first_blood &#64;{target|token_id} &#63;{Damage|0})=}}");
        buttons.push("{{[UTP List](!travutil_utp_list)=}}");
        if (isGm) {
            buttons.push("{{[Hidden UTP List](!travutil_utp_list_hidden)=}}");
            buttons.push("{{[Random Person Encounter](!travutil_random_person_encounter)=}}");
        }
        sendChat("TravUtils", "\w " + msg.who + "&{template:default} {{name=Main Menu}} "+ buttons.join(" "), null, {noarchive:true});
    }

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
        on("change:handout:gmnotes", function(obj, prev) {
            if (obj.get("name") == "SystemsData") {
                obj.get("gmnotes", loadSystemsPlayersKnow);  
            }
        });
        
        on("chat:message", function(msg) {
            if (msg.type != "api") {
                UTP_Roll_Scanner(msg);
                return;
            }
        
            if (msg.content.indexOf('!attack_token') != -1) {
                Attack(msg);
            } else if (msg.content.indexOf('!travutil_first_blood') != -1) {
                FirstBlood(msg);
            } else if (msg.content.indexOf('!travutil_starship_encounter') != -1) {
                StarshipEncounters(msg);
            } else if (msg.content.indexOf('!travutil_planet_info') != -1) {
                PlanetInfo(msg);
            } else if (msg.content.indexOf('!travutil_tradespec_available') != -1) {
                TradeSpecAvailable(msg);
            } else if (msg.content.indexOf('!travutil_tradespec_sell') != -1) {
                sellTradeSpec(msg);
            } else if (msg.content.indexOf('!travutil_cargo_available') != -1) {
                CargoPassengersAvailable(msg);
            } else if (msg.content.indexOf("!travutil_npc_reaction") != -1) {
                NpcReactions(msg);
            } else if (msg.content.indexOf("!travutil_random_person_encounter") != -1 ) {
                RandomPersonEncounters(msg);
            } else if (msg.content.indexOf("!travutil_utp_create") != -1) {
                UTP_Create(msg);
            } else if (msg.content.indexOf("!travutil_utp_list_hidden") != -1) {
                UTP_List(msg, 1);
            } else if (msg.content.indexOf("!travutil_utp_list") != -1) {
                UTP_List(msg);
            } else if (msg.content.indexOf("!travutil_utp_show") != -1) {
                UTP_Show(msg);
            } else if (msg.content.indexOf("!travutil_utp_delete") != -1) {
                UTP_Delete(msg);
            } else if (msg.content.indexOf("!travutil_utp_toggle_hide") != -1) {
                UTP_Toggle_Hide(msg);
            } else if (msg.content.indexOf("!travutil_utp_roll") != -1) {
                UTP_Roll(msg);
            } else if (msg.content.indexOf("!low_revivals") != -1) {
                LowRevivals(msg);
            } else if (msg.content.indexOf("!travutil_low_revivals") != -1) {
                LowRevivals(msg);
            } else if (msg.content.indexOf("!travutil_system_list_menu") != -1) {
                systemListMenu(msg);
            } else if (msg.content.indexOf("!travutil_main_menu") != -1) {
                mainMenu(msg);
            }
        });        
    };

    CheckInstall();
    loadInitialData();
    RegisterEvents();
    
});



