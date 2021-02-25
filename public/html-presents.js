var partyForm = '';
partyForm += '<div class="form"><label for="code">Code: </label>';
partyForm += '  <input type="text" autocomplete="off" id="code" placeholder="Party Code..." maxlength="5">';
partyForm += '  <br/><br/>';
partyForm += '  <button class="btn btn-success" onclick="joinParty(false)">Join Party</button>';
partyForm += '  <br/><br/>';
partyForm += '  <button class="btn btn-primary" onclick="joinParty(true)">Create a Party</button>';
partyForm += '</div>';


var usernameSetup = '';
usernameSetup += '<div class="form">';
usernameSetup += '  <label for="username">Username: </label>';
usernameSetup += '  <input type="text" autocomplete="off" id="username" placeholder="Username" maxlength="15">';
usernameSetup += '  <br/><br/>';
usernameSetup += '  <button class="btn btn-secondary" onclick="lockInUsername()">Set Username</button>';
usernameSetup += '</div>';


var partyWait = '';
partyWait += '<div class="form">';
partyWait += '  <div id="start-container">';
partyWait += '  </div>';
partyWait += '<h4>Party Members:</h4>'
partyWait += '<br/><div id="party-members"></div><br/><br/>'
partyWait += '<button class="btn btn-danger" onclick="leaveParty()">Leave Party</button>';
partyWait += '<br/><br/><br/><h5 id="current-class">Current Class: Soldier</h5><br/>'
partyWait += '<label for="change-class">Change Class:&nbsp;&nbsp;</label><button id="change-class" class="btn btn-warning" onclick="changeClass()">Change</button><br/><br/>'
partyWait += '<div id="level-ten-changer"></div>'
partyWait += '</div>';


var inventoryHTML = '';
inventoryHTML += '<h4>Hotbar:</h4>'
inventoryHTML += '<div id="hotbar">';
inventoryHTML += '  <button class="slot" id="hotbar-1" onmouseover="displayItemInfo(\'hotbar\', 0)" onmouseleave="resetStyle(\'hotbar\', 0)">1';
inventoryHTML += '  </button>&nbsp;';
inventoryHTML += '  <button class="slot" id="hotbar-2" onmouseover="displayItemInfo(\'hotbar\', 1)" onmouseleave="resetStyle(\'hotbar\', 1)">2';
inventoryHTML += '  </button>&nbsp;';
inventoryHTML += '  <button class="slot" id="hotbar-3" onmouseover="displayItemInfo(\'hotbar\', 2)" onmouseleave="resetStyle(\'hotbar\', 2)">3';
inventoryHTML += '  </button>&nbsp;';
inventoryHTML += '</div><br/><p><i>Press 1, 2, or 3 to switch to hotbar slot 1 to 3.</i></p><br/><p><i>To attack, click.</i>'
inventoryHTML += '<!--<h4>Armor:</h4><br/>';
inventoryHTML += '<div id="armor">';
inventoryHTML += '  <button class="slot" id="armor-1" onmouseover="displayItemInfo(\'armor\', 0)" onmouseleave="resetStyle(\'armor\', 0)">';
inventoryHTML += '  </button>&nbsp;';
inventoryHTML += '  <button class="slot" id="armor-2" onmouseover="displayItemInfo(\'armor\', 1)" onmouseleave="resetStyle(\'armor\', 1)">';
inventoryHTML += '  </button>&nbsp;';
inventoryHTML += '  <button class="slot" id="armor-3" onmouseover="displayItemInfo(\'armor\', 2)" onmouseleave="resetStyle(\'armor\', 2)">';
inventoryHTML += '  </button>&nbsp;';
inventoryHTML += '</div>--><br/>';
inventoryHTML += '<br/><br/><h3 id="item-name"></h3>'
inventoryHTML += '<br/><p id="item-desc"></p><br/><br/><p><i>To move, use WASD.</i></p>'


var youWonHTML = '';
youWonHTML += '<center><br/><br/><br/>';
youWonHTML += '<h1>You won!</h1>';
youWonHTML += '<br/><br/>'
youWonHTML += '<h4>The key for the form:</h4>'
youWonHTML += '<br/><br/>'
youWonHTML += '<textarea readonly id="key-cde">you got the key illegimately >:[</textarea>'
youWonHTML += '<br/><br/><button class="btn btn-primary" onclick="copyKey()">Copy the Key</button><br/><br/>'
youWonHTML += '<p id="share"></p>'
youWonHTML += '</center>';

//Code from https://www.makeadangvalentine.com/
function copyKey() {
  /* Get the text field */
  var copyText = document.getElementById("key-cde");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  document.execCommand("copy");

  /* Alert the copied text */
  document.getElementById("share").innerHTML = "Success!"

  setTimeout(function() {
    document.getElementById("share").innerHTML = ""
  }, 5000)
}
