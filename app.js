console.log("[PRE-LOAD]: Loading in packages...")
const express = require("express");
const socketIO = require("socket.io")
const gm = require("./game-objects.js");
const { createVector, getShorterLinePoints, getCircumcenter, dist} = require("./math-funcs.js")
const http = require("http")
console.log("[PRE-LOAD]: Finished loading packages.");

const FORM_KEY = "SavingEstherWasABitHardAndEasy.";
console.log("[PRE-LOAD]: -- KEY FOR FORM: " + FORM_KEY + " --")
const ADMIN_KEY = "jaidenisepic123";
console.log("[PRE-LOAD]: -- ADMIN KEY: " + ADMIN_KEY);

console.log("[PRE-LOAD]: Initializing Express and preparing the server...")
const app = express();


var server = http.Server(app);
var io = socketIO(server);

const SERVER_DOWN = false;
if (SERVER_DOWN) console.log("[PRE-LOAD]: Server has been set to be down!");

app.get("/", function(req, res) {
  res.redirect("/game");
})

app.get("/game", function(req, res) {
  if (!SERVER_DOWN) {
    res.sendFile(__dirname + "/public/index.html")
    return;
  }
  res.send("The server is down for an update. sorry lol i cant have any1 playing while im trying to fix things")
})

app.get("/howto", function(req, res) {
  res.sendFile(__dirname + "/public/howto/howto.html");
})

//Scripts
app.get("/script.js", function(req, res) {
  res.sendFile(__dirname + "/public/script.js")
})

app.get("/html-presents.js", function(req, res) {
  res.sendFile(__dirname + "/public/html-presents.js")
})

//Images
app.get("/assets/hamen.png", function(req, res) {
  res.sendFile(__dirname + "/assets/hamen.png")
})

app.get("/assets/game-first-page.png", function(req, res) {
  res.sendFile(__dirname + "/assets/game-first-page.png")
})

app.get("/assets/game-second-page.png", function(req, res) {
  res.sendFile(__dirname + "/assets/game-second-page.png")
})

app.get("/assets/game-third-page.png", function(req, res) {
  res.sendFile(__dirname + "/assets/game-third-page.png")
})

app.get("/assets/game-fourth-page.png", function(req, res) {
  res.sendFile(__dirname + "/assets/game-fourth-page.png")
})

app.get("/assets/knight.jpeg", function(req, res) {
  res.sendFile(__dirname + "/assets/knight.jpeg")
})

app.get("/assets/rabbi.jpg", function(req, res) {
  res.sendFile(__dirname + "/assets/rabbi.jpg")
})

app.get("/assets/wizard.png", function(req, res) {
  res.sendFile(__dirname + "/assets/wizard.png")
})

console.log("[PRE-LOAD]: Finished initializing Express.")

function emit(name, data) {
  io.sockets.emit(name, data);
}

console.log("[PRE-LOAD]: Adding events to socket.io...")
io.on('connection', function(socket) {
  //A check to see if to keep on using an id
  socket.on("still_here", (data) => {
    stillHereCallback.push(data.from)
  });
  //Get an id
  socket.on('get_id', (data) => {
    //console.log("[System]: got an ID request, sending them an ID..")
    let id = createId(12);
    console.log("[System]: Sending TempId " + data.tempId + " new ID " + id)
    emit("id_recieve", {to: data.tempId, id: id})
  });
  //Whenever someone joins a party by code
  socket.on('party_join', (data) => {
    if (data.createNewParty) {
      createParty({
        id: data.from,
        name: data.username
      })
    } else {
      addPlayerToPartyByCode({
        id: data.from,
        name: data.username
      }, data.code)
    }
  });
  //Closing the tab
  socket.on('close_tab', (data) => {
    usedIds.splice(usedIds.indexOf(data.from));
    console.log("[System]: " + data.from + " was detected to close the tab.")
  })
  //Whenever a person leaves the party.
  socket.on('leave_party', (data) => {
    let ind = findPlayerPartyIndex(data.from);
    let spliceInd = -1;
    if (ind == -1) return;

    for (let p in parties[ind].players) {
      if (parties[ind].players[p].id === data.from) {
        spliceInd = p;
      }
    }
    let pRemoved = parties[ind].players.splice(spliceInd, 1);
    pRemoved.party = null;
    if (parties[ind].players.length == 0) {
      clearInterval(parties[ind].updateInterval);
      let p__ = parties.splice(ind, 1);
      console.log("[Party " + p__[0].code + "]: No more players - removing party.")
    }
    if (data["doCallback"] == null || data["doCallback"] == true) {
      emit("not_in_party", {to: data.from});
    }
  })
  //Whenever the party leader starts it.
  socket.on('party_start', (data) => {
    let ind = findPlayerPartyObj(data.from);
    if (ind == null) return;
    if (ind.players[0].id == data.from) {
      console.log("[Party " + ind.code + "]: Starting Game for party...")
      var indx = ind;
      let intv = setInterval(() => {
        //Update the party clients.
        if (indx != null) {
          emit("party_update", {
            to: indx.getPlayerEmitCodes(),
            party: JSON.parse(JSON.stringify(indx.getJSONPrep()))
          })
        }
        //Checking if all players are dead, if so emit a death code.
        if (indx.allPlayersDead() && !indx.emittedDeathCode) {
          let deathMessages = [
            "lolol they suck",
            "haha get reckt",
            "they need to go back and train for 100 years",
            "bahahahahahahah LLLLLL",
            "they tried so hard but didn't win LOLOL"
          ]
          console.log("[Party " + ind.code + "]: All players are dead - " + deathMessages[Math.floor(Math.random() * deathMessages.length)]);
          emit("lol_u_died", {
            to: indx.getPlayerEmitCodes(),
          })
          indx.emittedDeathCode = true;
        }
        if (indx.level === 10) {
          indx.winningCode = FORM_KEY;
          let emitCodes = indx.getPlayerEmitCodes();
          emit("you_win", {to: emitCodes, key: FORM_KEY});
          for (let code_ of emitCodes) {
            setTimeout(() => {
              emit("get_win_code", {to: code_, key: FORM_KEY})
            }, 100)
          }
        }
      }, 50);
      ind.partyReady(intv);
    }
  });


  //Change a player class.
  socket.on('change_class', (data) => {
    let p = findPlayerObject(data.from);
    if (p == null) return;
    p.switchClass();

    emit("party_update", {
      to: p.party.getPlayerEmitCodes(),
      party: JSON.parse(JSON.stringify(p.party.getJSONPrep()))
    })

  });

  socket.on("go_to_level_ten", (data) => {
    let pty = findPlayerPartyObj(data.from);
    if (pty == null) return;
    if (pty.players[0].id != data.from) return;

    pty.skipPastEnd = !pty.skipPastEnd;
    emit("party_update", {
      to: pty.getPlayerEmitCodes(),
      party: JSON.parse(JSON.stringify(pty.getJSONPrep()))
    })
    console.log("[Party " + pty.code + "]: Changed going past level 10 to " + pty.skipPastEnd);
  })

  socket.on("next_room", (data) => {
    let pty = findPlayerPartyObj(data.from);
    if (pty == null) return;
    if (pty.room == null) return;

    if (pty.room.allEnemiesDead()) {
      //if (pty.players[0].id != data.id) return;
      console.log("[Party " + pty.code + "]: Attempting to enter a new room.")
      pty.enterNewRoom();
    }
  });

  socket.on("cheat_a_win_jaiden", (data) => {
    let ind = findPlayerPartyObj(data.from);
    if (ind == null) return;
    ind.level = 10;
  })

  /*
  * @data toChange   The player id to change
  * @data admin_key  The admin key
  * @data varName    The variable to change in the player object
  * @data varData    What the variable should change to
  */
  socket.on("cheat_change", (data) => {
    let p = findPlayerObject(data.toChange);
    //let pty = findPlayerPartyObj(data.toChange);
    if (p == null) return;
    if (data["admin_key"] != ADMIN_KEY) return;
    if (data["varName"] == null) return;

    try {
      p[data["varName"]] = data["varData"];
    } catch (e) {}
    console.log(`[SYSTEM-ADMIN]: Admin command recieved. Player ${data.toChange}'s ${data["varName"]} changed to ${data["varData"]}.`)

  })

  /*
  * @boolean data.fromPlayerId  If the party is found from an player id or code.
  * @string  data.toChange      The player id to change
  * @string  data.admin_key     The admin key
  * @string  data.varName       The variable to change in the player object
  * @object  data.varData       What the variable should change to
  */
  socket.on("cheat_change_party", (data) => {
    let fromPlayerId = (data.fromPlayerId || true);
    let p = (fromPlayerId) ? findPlayerPartyObj(data.toChange) : parties[findPartyIndexByCode(data.toChange)];
    //let pty = findPlayerPartyObj(data.toChange);
    if (p == null) return;
    if (data["admin_key"] != ADMIN_KEY) return;
    if (data["varName"] == null) return;

    try {
      p[data["varName"]] = data["varData"];
    } catch (e) {}
    let titleName = (fromPlayerId) ? "Player's Party" : "Party";
    console.log(`[SYSTEM-ADMIN]: Admin command recieved. ${titleName} ${data.toChange}'s ${data["varName"]} changed to ${data["varData"]}.`)

  })

  //Movement from keys
  socket.on('process_keys', (data) => {
    let p = findPlayerObject(data.from);
    if (p != null) {
      p.processKeys(data.keys);
    }
  })
  //OnClick, attacking
  socket.on('attack', (data) => {
    let pt = findPlayerPartyObj(data.from);
    if (pt == null) return;
    for (let p of pt.players) if (p.id === data.from) if (p.attack(data.attackArea)) emit("attack_success", {to: data.from});
  });

});
console.log("[PRE-LOAD]: Finished adding events.")

var parties = [];

function createParty(firstPlayerInfo) {
  let newCode = createCode();
  let newParty = new gm.Party(newCode);
  console.log("[Party " + newCode + "]: Created party!")
  newParty.addPlayerToParty(new gm.Player(firstPlayerInfo.id, firstPlayerInfo.name))
  parties.push(newParty)
  emit("party_update", {
    to: newParty.getPlayerEmitCodes(),
    party: JSON.parse(JSON.stringify(newParty.getJSONPrep()))
  })
}


function addPlayerToPartyByCode(playerInfo, code) {

  let p = findPartyIndexByCode(code);

  if (p === -1) {
    emit("party_not_found", {
      to: playerInfo.id,
    });
    return;
  };

  if (p.room != null) {
    emit("party_started_before", {
      to: playerInfo.id
    });
    return;
  }

  if (parties[p].players.length >= 5) {
    emit("party_too_big", {to: playerInfo.id})
    return;
  }
  parties[p].addPlayerToParty(new gm.Player(playerInfo.id, playerInfo.name));
  emit("party_update", {
    to: parties[p].getPlayerEmitCodes(),
    party: JSON.parse(JSON.stringify(parties[p].getJSONPrep()))
  })
}

function removePlayerFromParty(playerId) {
  for (let p in parties) {
    for (let _p in parties[p].players) {
      if (parties[p].players[_p].id === playerId) {
        let remov = parties[p].splice(_p, 1);
        return remov;
      }
    }
  }
  return null;
}

function findPartyIndexByCode(code) {
  for (let p in parties) {
    if (parties[p].code == code) {
      return p;
    }
  }
  return -1;
}

function findPlayerPartyIndex(playerId) {
  for (let p in parties) {
    for (let _p in parties[p].players) {
      if (parties[p].players[_p].id === playerId) {
        return p;
      }
    }
  }
  return -1;
}

function findPlayerPartyObj(playerId) {
  for (let p in parties) {
    for (let _p in parties[p].players) {
      if (parties[p].players[_p].id === playerId) {
        return parties[p];
      }
    }
  }
  return null;
}

function findPlayerObject(playerId) {
  for (let p in parties) {
    for (let _p in parties[p].players) {
      if (parties[p].players[_p].id === playerId) {
        return parties[p].players[_p];
      }
    }
  }
  return null;
}

//TODO: saved used ids if ids are saved to cookies. if so, create an expirery system.
var usedIds = [];

const chset = "qwertyuiopasdfghjklzxcvbnm1234567890".split("");
function createId(len) {
  let tid;
  do {
    tid = "";
    for (let i = 0; i < len; i++) {tid += chset[Math.floor(Math.random() * chset.length)]}
  } while (usedIds.includes(tid));
  usedIds.push(tid);
  return tid;
}


var usedCodes = [];

const code_chst = "1234567890".split("");

const code_length = 5;

function createCode() {
  let tid;
  do {
    tid = "";
    for (let i = 0; i < code_length; i++) {tid += code_chst[Math.floor(Math.random() * code_chst.length)]}
  } while (usedCodes.includes(tid));
  usedCodes.push(tid);
  return tid;
}

var stillHereCallback = [];

const doStillHereCheck = false;
if (!doStillHereCheck) console.log("[PRE-LOAD]: Still here/attendance check has been disabled.")

function sortOutDisconnectedPlayers() {
  stillHereCallback = [];
  emit("still_there", {})
  if (!doStillHereCheck) return;
  setTimeout(function() {
    //console.log(usedIds)
    for (let idX in usedIds) {
      if (!stillHereCallback.includes(usedIds[idX])) {
        console.log("[System]: " + usedIds[idX] + " didn't return anything during the still_here check.")
        let ind = findPlayerPartyIndex(usedIds[idX]);
        if (ind === -1) {
          console.log("[System]: " + usedIds[idX] + " was removed from usedIds.")
          usedIds.splice(idX, 1);
        } else {
          try {
            for (let i = 0; i < parties[ind].players.length; i++) {
              //console.log("going through p " + i)
              if (parties[ind].players[i].id === usedIds[idX]) {
                let prmv = parties[ind].players.splice(i, 1);
                console.log("[Party " + parties[ind].code + "]: Player " + prmv.id + " was removed from the party due to being inactive.")
                if (parties[ind].players.length == 0) {
                  console.log("[Party " + parties[ind].code + "]: Removed party due to no more players in it.")
                  clearInterval(parties[ind].updateInterval);
                  parties.splice(ind, 1);
                }
              }
            }
            usedIds.splice(idX, 1)
          } catch (e) {}
        }
      }
    }
  }, 100)

}

const PORT = 4000;
console.log("[PRE-LOAD]: Port has been set to " + PORT + ".")

const CALLBACK_TIMING = 2000;
if (doStillHereCheck) {
  console.log("[PRE-LOAD]: Starting inactive player checker, set to happen every " + (CALLBACK_TIMING / 1000) + " seconds.")
}

var callbackFunc = setInterval(function() {
  sortOutDisconnectedPlayers();
}, CALLBACK_TIMING)

console.log("[PRE-LOAD]: Attempting to start server...")
server.listen(PORT, () => {
  console.log("[PRE-LOAD]: Switching console types from pre-load info to general info.")
  console.log("")
  console.log("[SERVER]: Server started at http://localhost:" + PORT)
  console.log("[SERVER]: Sending out reload requests for old pages...")
  console.log("")
  //console.log("Opening...")
  // exec("open http://localhost:" + PORT, (err, stdout, stderr) => {
  //   if (err) throw err;
  //   console.log(stdout);
  // })
  //
  setTimeout(function() {
    emit("server_reload", {})
  }, 1000)
})
