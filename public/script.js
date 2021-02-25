var socket = io();

var phase = 0;
//0: Display Username + Party Information
//1: NOTHING
//2: NOTHING
//3: NOTHING
//4: NOTHING
//phase >= 5: Display Room
//6: Display with puzzle

var id = "";

const chset = "qwertyuiopasdfghjklzxcvbnm1234567890".split("");
function createTempId(len) {
  let tid = "";
  for (let i = 0; i < len; i++) {tid += chset[Math.floor(Math.random() * chset.length)]}
  return tid;
}

const tempId = createTempId(10);
console.log("temp id setup, id: " + tempId);

function emit(code, data) {
  socket.emit(code, data);
}

var username = "";

function lockInUsername() {
  username = (username.length < 2) ? document.getElementById("username").value : username;
  if (username.length < 2) {
    alert("Username has to be at least 2 characters.")
    return;
  }
  inventoryEle.innerHTML = partyForm;
}

var currentLocation = window.location;
var query = currentLocation.search;
var searchParams = new URLSearchParams(query);

//get info
var __name = searchParams.get('username');
var setUsernameOnLoad = false;
if (__name != null) {
   console.log("Name '" + __name + "' detected, will set it in a bit.");
   setUsernameOnLoad = true;
}

function joinParty(createParty) {
  let code = document.getElementById("code").value;
  if (code.length < 5 && createParty == false) {
    alert("The code needs to be 5 characters.")
    return;
  }
  emit("party_join", {
    from: id,
    createNewParty: createParty,
    code: code,
    username: username
  });
}

function leaveParty() {
  emit("leave_party", {from: id})
}

function attemptStart() {
  emit("party_start", {
    from: id,
  })
}


//ID SYSTEM
var recievedId = false;

socket.on("id_recieve", (data) => {
  if (data.to === tempId && !recievedId && id.length < 2) {
    id = data.id;
    recievedId = true;
    console.log("recieved id " + data.id);
    setTimeout(function() {
      console.log("%cHey.", "background: red; color: yellow; font-size: x-large");
      console.log("%cYou won't be able to manipulate any items or health in here.", "font-size: medium;")
      console.log("...Well, not exactly true. You'll be able to gain all the items and health you want... for 1/20th of a second.")
      console.log("If you know *exactly* what you are doing, cool! If not, I wouldn't mess around. What you're going to end up doing is mess up the game for yourself only.")
      console.log("%cAnyway, enjoy the game.", "background: red; color: yellow; font-size: medium;")
    }, 500);

  }
});


//

var currentPartyData = null;

var setInventoryHTML = false;

function updateSideData() {
  if (currentPartyData == null) return;
  if (currentPartyData.level == -1) {
    inventoryEle.innerHTML = partyWait;
    if (currentPartyData.players[0].id == id) {
      document.getElementById("start-container").innerHTML = '<button class="btn btn-success" onclick="attemptStart()">Start!</button><br/><br/>';
      document.getElementById("level-ten-changer").innerHTML = '<label for="change-class" id="cont-info">Get key at level 10 (set to ' + ((goToLevelTenVar) ? "yes" : "no") + ' right now):&nbsp;&nbsp;</label><button class="btn btn-info" onclick="changeToLevelTen()">Change</button>';
    }
    for (let i = 0; i < currentPartyData.players.length; i++) {
      if (currentPartyData.players[i].id === id) {
        document.getElementById("party-members").innerHTML += '<h4><b>You (' + username + ') - ' + currentPartyData.players[i].class + '</b></h4>';

        document.getElementById("current-class").textContent = 'Current Class: ' + currentPartyData.players[i].class;
      } else {
        document.getElementById("party-members").innerHTML += '<h4>' + currentPartyData.players[i].name + ' - ' +  currentPartyData.players[i].class + '</h4>'
      }
    }
  } else if (currentPartyData.level > -1 && !setInventoryHTML) {
    inventoryEle.innerHTML = inventoryHTML;
    setInventoryHTML = true;
  }
}

function changeClass() {
  emit("change_class", {from: id})
}

var goToLevelTenVar = true;
function changeToLevelTen() {
  goToLevelTenVar = !goToLevelTenVar;
  document.getElementById("cont-info").innerHTML = "Get key at level 10 (set to " + ((goToLevelTenVar) ? "yes" : "no") + " right now):&nbsp;&nbsp;";
  emit("go_to_level_ten", {from: id});
}

function allEnemiesDead() {
  if (currentPartyData == null) return false;
  if (currentPartyData.room == null) return false;
  let dc = 0;
  let enc = 0;
  for (let en of currentPartyData.room.entities) {
    if (en.entity_type != "Enemy") continue;
    enc++;
    if (en.health <= 0) dc++;
  }
  return (dc == enc);
}

//Exit Door: {x: 460, y: 200, w: 40, h: 200}
function playerCollidingWithExitDoor() {
  let disP = getThisPlayerObj();
  if (disP == null) return false;
  let ed = {x: 460, y: 150, w: 40, h: 200}

  //https://www.geeksforgeeks.org/find-two-rectangles-overlap/
  // let l1 = {x: ed.x, y: ed.y}
  // let l2 = {x: ed.x + ed.w, y: ed.y + ed.h}
  // let r1 = {x: thisP.x, y: thisP.y}
  // let r2 = {x: thisP.x + PLAYER_SIZE, y: thisP.y + PLAYER_SIZE}

  // if (l1.x >= r2.x || l2.x >= r1.x) {
  //     return false;
  // }
  //
  // // If one rectangle is above other
  // if (l1.y <= r2.y || l2.y <= r1.y) {
  //     return false;
  // }
  //
  // return true;

//A really botched version of this lol
  let thisP = {x: disP.x + PLAYER_SIZE, y: disP.y + PLAYER_SIZE}

  return (thisP.x >= ed.x && thisP.x <= ed.x + ed.w && thisP.y >= ed.y && thisP.y <= ed.y + ed.h)
}

//Party [Error/Update] Messages
socket.on("party_update", (data) => {
  if (data.to.includes(id)) {
    currentPartyData = data.party;
    updateSideData();
    if (currentPartyData.level > -1 && phase != 1) {
      phase = 1;
    }

    if (currentPartyData.winningCode != null) {
      document.getElementById("body").innerHTML = youWonHTML;
      var key4form = data.key;
      setTimeout(function() {
        document.getElementById("key-cde").innerHTML = key4form;
      }, 50)
      setTimeout(function() {
        if (currentPartyData != null) emit("leave_party", {from: id});
        emit("close_tab", {from: id, doCallback: false});
      }, 75)
    }
    //console.log("Party Update Recieved.")
  }
});

socket.on("party_not_found", (data) => {
  if (data.to === id) {
    alert("Party with code '" + document.getElementById("code").value + "' not found.")
    document.getElementById("code").value = "";
  }
})

socket.on("party_too_big", (data) => {
  if (data.to === id) {
    alert("That party already has the max of 5 players in it!");
    document.getElementById("code").value = "";
  }
});

socket.on("party_started_before", (data) => {
  if (data.to === id) {
    alert("That party has already started the game!")
    document.getElementById("code").value = "";
  }
})

socket.on("not_in_party", (data) => {
  if (data.to === id) {
    lockInUsername();
    currentPartyData = null;
    phase = 0;
    setInventoryHTML = false;
  }
})

//One of the most important socket requests. It's kinda like attendance, but if attendance was taken every 2 seconds.
socket.on("still_there", (data) => {
  emit("still_here", {from: id})
})

socket.on("attack_success", (data) => {
  if (data.to == id) {
    insideAttackAreaColor = 255;

    //Change the attack cooldown bar

    //Check if the player is not null, and the attack speed of the active item isn't null
    var thisP = getThisPlayerObj();
    if (thisP == null) return;

    //if ((thisP.hotbar[thisP.activeHotbar] || {})["speed"] == null) return;
    if (thisP.hotbar[thisP.activeHotbar] == null) return;

    document.getElementById("attack-cooldown").innerHTML = "Attack Cooldown: <span style=\"background-color: rgb(0,0,0); color: rgb(0,0,0);\">" + createBar(10) + "</span> (Waiting)";

    let spd = ((thisP.hotbar[thisP.activeHotbar]).stats["speed"] || 0) + 1000;
    //Go and set timeouts to change the attack cooldown bar.
    for (let i = 0; i < 10; i++) {
      setTimeout(function() {
        document.getElementById("attack-cooldown").innerHTML = "Attack Cooldown: <span style=\"background-color: #32a0a8; color: #32a0a8;\">" + createBar(i) + "</span><span style=\"background-color: rgb(0,0,0); color: rgb(0,0,0);\">" + createBar(10 - i) + "</span> (Waiting)"
      }, nclamp(((i + 1) * (spd / 10)) - 5), 0, 1495)
    }
    setTimeout(function() {
      document.getElementById("attack-cooldown").innerHTML = "Attack Cooldown: <span style=\"background-color: #32a0a8; color: #32a0a8;\">" + createBar(10) + "</span> (Ready!)";
    }, spd - 5);
    console.log(spd)

  }
})

socket.on("lol_u_died", (data) => {
  if (data.to.includes(id)) {
    alert("Oh no! Your whole party died. You must restart this again!")
    //location.reload();
    location.href = "/game?username=" + encodeURIComponent(username);
  }
});

socket.on("you_win", (data) => {
  if (data.to.includes(id)) {
    document.getElementById("body").innerHTML = youWonHTML;
    var key4form = data.key;
    setTimeout(function() {
      document.getElementById("key-cde").innerHTML = key4form;
    }, 50)
    setTimeout(function() {
      if (currentPartyData != null) emit("leave_party", {from: id});
      emit("close_tab", {from: id, doCallback: false});
    }, 75)
  }
})

socket.on("get_win_code", (data) => {
  if (data.to === id) {
    var key4form = data.key;
    setTimeout(function() {
      document.getElementById("key-cde").innerHTML = key4form;
    }, 50)
  }
})

socket.on("server_reload", (data) => {
  console.log("Reload request recieved.")
  alert("Hey, an update has been released! Unfortunately, we're going to reload the page.")
  location.reload();
})

let msgData = {
  msg: "",
  displaying: false,
  removalTime: 0
}
socket.on("msg", (data) => {
  if (data.to != id) return;

  msgData.displaying = true;
  msgData.msg = data.msg;
  msgData.removalTime = new Date().getTime() + (data.time || 5000);
  setTimeout(function() {
    if (msgData.removalTime > new Date().getTime()) return;
    msgData.displaying = false;
  }, data.time || 5000);
})

var inventoryEle = document.getElementById("inventoryHolder");

var hmtshn, sword, knight, wizard, rabbi;

function preload() {
  hmtshn = loadImage('assets/hamen.png');
  knight = loadImage('assets/knight.jpeg');
  rabbi = loadImage('assets/rabbi.jpg');
  wizard = loadImage('assets/wizard.png');
}

function setup() {
  let canvas = createCanvas(500,500);
  canvas.parent("canvasHolder");
  setTimeout(function() {
    inventoryEle.innerHTML = usernameSetup;
    console.log("emitting a get_id request from " + tempId + "...")
    emit("get_id", {
      tempId: tempId
    })
    setTimeout(function() {
      if (setUsernameOnLoad) {
        document.getElementById("username").value = decodeURIComponent(__name);
        lockInUsername();
      }
    }, 25)
  }, 25);
}

var offset = {
  x: 0,
  y: 0
}

const PLAYER_SIZE = 40;
const ENEMY_SIZE = 40;

var insideAttackAreaColor = 0;
var currentAttackArea;

var nextRoomReqCooldown = 0;

function draw() {
  background(0);
  if (phase == 0) {
    textSize(25);
    fill(255)
    text("Party Code: " + ((currentPartyData === null) ? "Not in a party yet." : currentPartyData.code), 50, 100)
    text("Username: " + ((username.length === 0) ? "Not set yet." : username), 50, 150);
  }
  if (currentPartyData == null) return;
  noStroke()
  if (phase == 1) {
    fill(184, 143, 68)
    rect(0, 0, 500, 500)
    let thisP = getThisPlayerObj();

    //Draw exit door
    if (allEnemiesDead()) {
      fill(156, 88, 11);
      rect(460, 150, 40, 200);
      if (playerCollidingWithExitDoor() && nextRoomReqCooldown == 0) {
        console.log("next room :0")
        emit("next_room", {from: id}); //Next room
        nextRoomReqCooldown = 60;
      }
      if (nextRoomReqCooldown > 0) {
        nextRoomReqCooldown--;
      }

      // msgData.displaying = true;
      // msgData.msg = "Go into the door to enter the next room."
      // msgData.removalTime = 999999999999999;
    }

    //Draw Players
    for (let p of currentPartyData.players) {
      if (p.health <= 0) continue;
      fill(p.color.r, p.color.g, p.color.b, 100)
      if (p.id === id) {
        fill(0)
        textSize(10)
        text("(You)", p.x - offset.x, p.y - offset.y - 25);
        fill(0,255,0,100)
      }
      let imageToDisplay = (p.class == "Rabbi") ? rabbi : ((p.class == "Sorcerer") ? wizard : knight);
      image(imageToDisplay, p.x - offset.x, p.y - offset.y, PLAYER_SIZE, PLAYER_SIZE);
      rect(p.x - offset.x, p.y - offset.y, PLAYER_SIZE, PLAYER_SIZE)


      if (p.id === id) continue;
      fill(0)
      textSize(10)
      text(p.name, p.x - offset.x, p.y - offset.y - 25);
      rect(p.x - 5, p.y - 20, PLAYER_SIZE + 10, 10);
      fill(0, 200, 0)
      rect(p.x - 5, p.y - 20, (PLAYER_SIZE + 10) * (p.health / p.maxHealth), 10);
    }


    //Draw Entities
    for (let enmy of currentPartyData.room.entities) {
      if (enmy.entity_type == "Enemy") {
        if (enmy.dead) continue;
        fill(255, 0, 0)
        image(hmtshn, enmy.x - offset.x, enmy.y - offset.y, ENEMY_SIZE, ENEMY_SIZE)
        fill(0)
        rect(enmy.x - 5, enmy.y - 20, ENEMY_SIZE + 10, 10);
        fill(0, 200, 0)
        rect(enmy.x - 5, enmy.y - 20, (ENEMY_SIZE + 10) * (enmy.health / enmy.maxHealth), 10);
      }

      //Draw attack area/do calculations.
      if (thisP.class == "Soldier" && thisP.health > 0) {
        fill(insideAttackAreaColor, 0, 255 - insideAttackAreaColor, 50)
        stroke(0)
        let middleOfPlayer = {
          x: thisP.x - offset.x + (PLAYER_SIZE / 2),
          y: thisP.y - offset.y + (PLAYER_SIZE / 2)
        };

        let pointsOne = getShorterLinePoints(middleOfPlayer.x, mouseX, middleOfPlayer.y, mouseY);
        let deltaX = pointsOne.x - middleOfPlayer.x;
        let deltaY = pointsOne.y - middleOfPlayer.y;

        let vec = createVector(deltaX, deltaY);
        vec.rotate(PI/6);
        vec.add(createVector(middleOfPlayer.x, middleOfPlayer.y))

        let vec2 = createVector(deltaX, deltaY);
        vec2.rotate(-PI/6);
        vec2.add(createVector(middleOfPlayer.x, middleOfPlayer.y))

        currentAttackArea = {
          middleOfPlayer: middleOfPlayer,
          vec: {x: vec.x, y: vec.y},
          vec2: {x: vec2.x, y: vec2.y}
        }

        triangle(middleOfPlayer.x, middleOfPlayer.y, vec2.x, vec2.y, vec.x, vec.y)

        if (insideAttackAreaColor > 0) {
          insideAttackAreaColor -= 5;
        }

        noStroke();
      } else if (thisP.class == "Rabbi" && thisP.health > 0) {
        let middleOfPlayer = {
          x: thisP.x - offset.x + (PLAYER_SIZE / 2),
          y: thisP.y - offset.y + (PLAYER_SIZE / 2)
        };

        currentAttackArea = {
          mouse: {x: mouseX, y: mouseY},
          middleOfPlayer,
        }
        stroke(255, 255, 41, 50);
        line(middleOfPlayer.x, middleOfPlayer.y, mouseX, mouseY)
        noStroke();
      } else if (thisP.class == "Sorcerer" && thisP.health > 0) {
        currentAttackArea = {
          mouse: {x: mouseX, y: mouseY}
        }
        fill(255, 255, 41, 50)
        ellipse(mouseX, mouseY, 10, 10)
      }

      // stroke(0)
      // let middleOfEnemy = createVector(enmy.x + (ENEMY_SIZE / 2), enmy.y + (ENEMY_SIZE / 2))
      // if (dist_(middleOfEnemy, getCircumcenter(middleOfPlayer, vec, vec2)) <= 50) {
      //   stroke(255, 255, 0)
      // }
      // line(middleOfPlayer.x, middleOfPlayer.y, middleOfEnemy.x, middleOfEnemy.y)
      // noStroke()
    }

    //Set Hotbar slot
    try {
      document.getElementById("hotbar-1").style = (thisP.activeHotbar == 0) ? "background-color: rgb(255, 0, 0);" : "";
      document.getElementById("hotbar-2").style = (thisP.activeHotbar == 1) ? "background-color: rgb(255, 0, 0);" : "";
      document.getElementById("hotbar-3").style = (thisP.activeHotbar == 2) ? "background-color: rgb(255, 0, 0);" : "";

      if (itemDisplayInfo.displaying && itemDisplayInfo.type == "hotbar") {
        try {
          document.getElementById("hotbar-" + (itemDisplayInfo.itemShowing + 1)).style = "background-color: #c95357;";
        } catch (e) {}
      } else if (!itemDisplayInfo.displaying) {
        displayItemInfo("hotbar", thisP.activeHotbar);
      }
    } catch (e) {}

    //Set msg if there is one
    try {
      if (msgData.displaying) {
        document.getElementById("item-desc") = msgData.msg;
        document.getElementById("item-name") = "";
      }
    } catch (e) {}

    //Set bottom info
    try {
      if (thisP.maxHealth < 31) {
        document.getElementById("health").innerHTML = "Your Health: " + "<span style=\"background-color: rgb(0, 200, 0); color: rgb(0, 200, 0);\">" + createBar(nclamp(Math.round(thisP.health), -1, thisP.maxHealth)) + "</span>" + "<span style=\"background-color: rgb(0, 0, 0); color: rgb(0, 0, 0);\">" + createBar(thisP.maxHealth - Math.round(thisP.health)) + "</span><span style=\"background-color: rgb(232, 237, 97); color: rgb(232, 237, 97);\">" + createBar(nclamp(thisP.health - thisP.maxHealth, 0, 999999)) + "</span>&nbsp;&nbsp;(" + Math.round(thisP.health) + " / " + thisP.maxHealth + ")";
      } else {
        document.getElementById("health").innerHTML = "Your Health: &nbsp;&nbsp;" + Math.round(thisP.health) + " / " + thisP.maxHealth + " (Health was too large to display a bar.)";
      }

      if (thisP.class == "Rabbi" && currentPartyData != null) {
        document.getElementById("other-info").innerHTML = "Healing Usages: <span style=\"color: rgb(247, 255, 31)\">" + createBar(thisP.healAmounts) + "</span><span style=\"color: rgb(0,0,0);\">" + createBar((3 + Math.floor(currentPartyData.level / 2)) - thisP.healAmounts) + "</span> (" + thisP.healAmounts + " / " + (3 + Math.floor(currentPartyData.level / 2)) + ")";

      }
    } catch (e) {}


    //Dev Tools

    //line((mouseX - middleOfPlayer.x) / 2 + middleOfPlayer.x, (mouseY - middleOfPlayer.y) / 2 + middleOfPlayer.y, middleOfPlayer.x, middleOfPlayer.y);
    // line(mouseX, mouseY, middleOfPlayer.x, middleOfPlayer.y)
    // line(middleOfPlayer.x, middleOfPlayer.y, middleOfPlayer.x + 50, middleOfPlayer.y)
    // line(middleOfPlayer.x + 50, middleOfPlayer.y, mouseX, mouseY)

    //this: https://stackoverflow.com/questions/15994194/how-to-convert-x-y-coordinates-to-an-angle
    //also this: https://academo.org/demos/rotation-about-point/
    // let deg = rad * 180 / Math.PI + 180;
    //
    // let dtX = mouseX - middleOfPlayer.x;
    // let dtY = mouseY - middleOfPlayer.y;
    // let pr = {
    //   x: (dtX * Math.cos(deg)) - (dtY * Math.sin(deg)) + middleOfPlayer.x,
    //   y: (dtY * Math.sin(deg)) + (dtX * Math.cos(deg)) + middleOfPlayer.y
    // }
    // line(middleOfPlayer.x, middleOfPlayer.y, pr.x, pr.y)

    // stroke()
    // line(middleOfPlayer.x, middleOfPlayer.y, pointsOne.x, pointsOne.y)


  }
}

var lastActiveHotbar = 0;

const lineLen = 75;
function getShorterLinePoints(x1, x2, y1, y2) {
  //http://jsfiddle.net/3SY8v/
  let deltaX = x2 - x1;
  let deltaY = y2 - y1;
  let hlen = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
  let ratio = lineLen / hlen; //lineLen is how long the line would be
  let smallerXLen = deltaX * ratio;
  let smallerYLen = deltaY * ratio;
  let smallerX = x1 + smallerXLen;
  let smallerY = y1 + smallerYLen;
  return {
    x: smallerX,
    y: smallerY
  }
}

function nclamp(n, min, max) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function dist_(point1, point2) {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

//Thank you math class :P
function getCircumcenter(a_, b_, c_) {
  let x1 = a_.x;
  let y1 = a_.y;
  let x2 = b_.x;
  let y2 = b_.y;
  let x3 = c_.x;
  let y3 = c_.y;

  // x1 + x2 / 2, y1 + y2 / 2
  let M_AB = createVector((x1 + x2) / 2, (y1 + y2) / 2);
  // console.log("M_AB: ", M_AB)
  //rise / run, (y2 - y1) / (x2 - x1)
  let m_AB = (y2 - y1) / (x2 - x1);
  let mp_AB = -(x2 - x1) / (y2 - y1);
  // console.log("slopes of AB: " + m_AB + ", prime: " + mp_AB)
  //y = mx + b - solve for b
  //y - mx = b
  let b_eq_AB = M_AB.y - (mp_AB * M_AB.x);
  // console.log("base of AB: " + b_eq_AB)

  // x1 + x2 / 2, y1 + y2 / 2
  let M_CB = createVector((x2 + x3) / 2, (y2 + y3) / 2);
  // console.log("M_CB: ", M_CB)
  //rise / run, (x2 - x1) / (y2 - y1)
  let m_CB = (y3 - y2) / (x3 - x2);
  let mp_CB = -(x3 - x2) / (y3 - y2);
  // console.log("slopes of CB: " + m_CB + ", prime: " + mp_CB)
  //y = mx + b - solve for b
  //y - mx = b
  let b_eq_CB = M_CB.y - (mp_CB * M_CB.x);
  // console.log("base of CB: " + b_eq_CB)

  //subsitution - solving for x
  //mx + b = mx + b
  //m1(x) + b1 = m2(x) + b2
  //(m1 - m2)(x) = (b2 - b1)
  //get reciprocal - x * 1/x
  //x = RCPCAL(b2 - b1)
  let base_eqs = b_eq_CB - b_eq_AB; //b2 - b1
  let x_rcpl = 1/(mp_AB - mp_CB);
  let x_answer = x_rcpl * base_eqs;

  //M_.y = mp_ * (x_answer) + b_eq
  let y_answer = mp_AB * x_answer + b_eq_AB;

  return createVector(x_answer, y_answer)
}

const KEYCODES = {
  W: 87,
  A: 65,
  S: 83,
  D: 68,
  SHIFT_LEFT: 16,
  SPACE: 32,
  ONE: 49,
  TWO: 50,
  THREE: 51
}

let keys_down = {
  W: false,
  A: false,
  S: false,
  D: false,
  "1": false,
  "2": false,
  "3": false
};

function keyPressed() {
  keys_down[key.toUpperCase()] = true;

  if (["1", "2", "3"].includes(key.toUpperCase())) {
    setTimeout(function() {
      try {
          displayItemInfo("hotbar", getThisPlayerObj().activeHotbar);
      } catch (e) {}
    }, 50);
  }
}

function keyReleased() {
  keys_down[key.toUpperCase()] = false;
}

function mouseClicked() {
  if (currentPartyData == null) return;
  if (currentPartyData.room != null) {
    emit("attack", {
      from: id,
      attackArea: currentAttackArea
    })
    //insideAttackAreaColor = 255;
  }
}

var keySender = setInterval(function() {
  if (currentPartyData != null) {
    emit("process_keys", {
      from: id,
      keys: keys_down
    })
  }
}, 50)

function getThisPlayerObj() {
  if (currentPartyData == null) return;
  for (let p of currentPartyData.players) {
    if (p.id === id) {
      return p;
    }
  }
  return null;
}

var itemDisplayInfo = {
  displaying: false,
  itemShowing: 0,
  type: ""
}

function displayItemInfo(type, n) {
  if (msgData.displaying) return;

  let thisp = getThisPlayerObj();
  if (thisp == null) return;
  let itms = {
    hotbar: thisp.hotbar,
    armor: thisp.armor,
    other: thisp.items,
  }
  if (itms[type] != null) {
    document.getElementById(type + "-" + (n + 1)).style = "background-color: #c95357;"
    if (itms[type].length > n) {
      itemDisplayInfo = {
        displaying: true,
        itemShowing: n,
        type,
      }

      let t = itms[type];
      document.getElementById("item-name").innerHTML = t[n].name;
      document.getElementById("item-desc").innerHTML = t[n].desc;
      let st = t[n].stats;
      try {
        if (st["health_addition"] != null) {
          document.getElementById("item-desc").innerHTML += "<br/>Health: " + ((st["health_addition"] > 0) ? "+" : "") + st["health_addition"];
        }
      } catch (e) {}
      try {
        if (st["defense"] != null) {
          document.getElementById("item-desc").innerHTML += "<br/>Defense: " + ((st["defense"] > 0) ? "+" : "") + st["health_addition"];
        }
      } catch (e) {}
      try {
        if (st["attack_damage"] != null) {
          document.getElementById("item-desc").innerHTML += "<br/>Damage: " + ((st["attack_damage"] > 0) ? "+" : "") + st["attack_damage"];
        }
      } catch (e) {}
      try {
        if (st["speed"] != null) {
          document.getElementById("item-desc").innerHTML += "<br/>Attack Speed: " + ((st["speed"] == 0) ? "Medium" : ((st["speed"] > 0) ? "Low" : "Fast"));
        }
      } catch (e) {}
    } else {
      document.getElementById("item-name").innerHTML = "";
      document.getElementById("item-desc").innerHTML = "";
    }
  }
}

function resetStyle(type, n) {
  if (msgData.displaying) return;

  document.getElementById(type + "-" + (n + 1)).style = "";
  document.getElementById("item-name").innerHTML = "";
  document.getElementById("item-desc").innerHTML = "";

  itemDisplayInfo.displaying = false;
}

const _BAR_TEXT_ = "■";

function createBar(len) {
  let b = "";
  for (let i = 0; i < len; i++) b += _BAR_TEXT_;
  return b;
}

window.onbeforeunload = function (e) {
  if (currentPartyData != null) emit("leave_party", {from: id});
  emit("close_tab", {from: id, doCallback: false});
  //return "The game has been stoppped."
}
