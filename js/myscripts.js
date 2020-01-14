
CONTAINER = 200; //the default height of the buttons container
CONTENT_FILTERS = 125 //the default height of the Content filters area
var containerHeight = CONTAINER; //the current height of the buttons container
var contentFiltersCurrent = CONTENT_FILTERS;
var selectedCards = "";
var selectedCardsAmount = 0;

var request = new XMLHttpRequest();
request.open("GET", "textData/proj.json", false);
request.send(null);
var projData_basic = JSON.parse(request.responseText);
var request2 = new XMLHttpRequest();
request2.open("GET", "textData/preludeCards.json", false);
request2.send(null);
var projData_prelude = JSON.parse(request2.responseText);
var projData = projData_basic.concat(projData_prelude);
var projDataIndexed = {};
projData.forEach(function (projCard, index) {
  projDataIndexed[projCard.number] = projCard;
});

var resourceTypes = ['MC', 'Steel', 'Titanium', 'Plant', 'Energy', 'Heat'];
var resourceTypeToIdx = {'MC': 0, 'M\$': 0, 'Steel': 1, 'Titanium': 2, 'Plant': 3, 'Energy': 4, 'Heat': 5};
var resourceTypesSmall = ['mc', 'steel', 'titanium', 'plant', 'energy', 'heat'];
var resourceTypesSmallToIdx = {'mc': 0, 'm\$': 0, 'steel': 1, 'titanium': 2, 'plant': 3, 'energy': 4, 'heat': 5};
var resourceValue = [42, 10, 5, 0, 0, 0];
var resourceProduction = [-1, 0, 1, 0, 0, 0];
var worth_Steel = 2;
var worth_Titanium = 3;
var worth_Plant = 8;
var proj_discount = 0;
var proj_rebate = 0;
var projCardForPromotion = null;
var vp = 0;
var terraformingTypes = ['TR', 'Ocean Tile', 'O2', 'TempUp']
var terraformingTypesToIdx = {'TR': 0, 'Ocean Tile': 1, 'O2': 2, 'TempUp': 3}
var terraformingTypesSmall = ['tr', 'ocean', 'o2', 'temp']
var terraformingTypesSmallToIdx = {'tr': 0, 'ocean': 1, 'o2': 2, 'temp': 3}
var terraformingValue = [20, 0, 0, -30];
var terraformingMax = [99, 9, 14, 8];
var terraformingStep = [1, 1, 1, 2];
var terraformingSpecialCombo = [[], [], [8], [-24, -20, 0]];
var log_all = []
var log_current = []
var cardsInHand = new Set();
var cardsUsed = new Set();
var lastClickedCard = null;

//parse the url
urlString = window.location.href;
cards = parseURLParams(urlString);

//display all card or only few ones if pointed
if (cards == "ALL") {showAll();}
else {
  displayCardsOnly(cards);
  zoomSingleCard();}

function showAll() {
  var x, i;
  displayedProjects = 345;
  displayedCorporations = 38;
  displayedPreludes = 35;
  displayedColonies = 11;
  displayedGlobals = 1;

  document.getElementById("buttonsContainer").style.display = "block";

  // var elements = document.querySelectorAll('.ul-title');
  // for (i=0; i<elements.length; i++){elements[i].style.display = "block";}
  // document.getElementById("totalProjects").innerHTML = displayedProjects;
  // document.getElementById("totalCorporations").innerHTML = displayedCorporations;
  // document.getElementById("totalPreludes").innerHTML = displayedPreludes;
  // document.getElementById("totalColonies").innerHTML = displayedColonies;
  // document.getElementById("totalGlobals").innerHTML = displayedGlobals;
  
  refreshStatus();
  refreshUnplayableCard();
  
  //making all buttons inactive
  y = document.querySelectorAll('button.active');
  if (y.length > 0) {
      for (i = 0; i < y.length; i++) {
          y[i].classList.toggle("active");
      }
  }
  //showing all cards
  x = document.querySelectorAll('.filterDiv');
  for (i = 0; i < x.length; i++) {w3AddClass(x[i], "show");}
  console.log("invoked ShowAll()");
}

////////////////////// My code! ////////////////////////////
function refreshScreen() {
  refreshStatus();
  showHand();
}

function refreshStatus() {
  resourceTypesSmall.forEach(function (type, index) {
    document.getElementById(type).innerHTML = resourceValue[index];
    document.getElementById("prod_" + type).value = resourceProduction[index];
  });

  terraformingTypesSmall.forEach(function (type, index) {
    document.getElementById("terraforming_" + type).value = terraformingValue[index];
    if (type != "tr") {
      document.getElementById("terraforming_" + type + "_slider").value = terraformingValue[index];
    }
  });
}

function refreshUnplayableCard() {
  x = document.querySelectorAll('li.filterDiv');
  for (i = 0; i < x.length; i++) {
    if (x[i].querySelector(".number") != null) {
      var rawNumber = x[i].querySelector(".number").textContent.substring(1);
      w3RemoveClass(x[i], "unplayable-card");
      if (isPlayable(rawNumber) == false) {
        w3AddClass(x[i], "unplayable-card");
      }
    }
  }
}

function showUsed() {
  console.log("cardsPlayed: " + cardsUsed);
  x = document.querySelectorAll('li.filterDiv');
  for (i = 0; i < x.length; i++) {
    w3RemoveClass(x[i], "show");
    if (x[i].querySelector(".number") != null) {
      var rawNumber = x[i].querySelector(".number").textContent.substring(1);
      if (cardsUsed.has(rawNumber)) {
        w3AddClass(x[i], "show");
        console.log("showing " + x[i].querySelector(".number").textContent + " by .number");
      }
    } else {
      if (cardsUsed.has(x[i].id)) {
        w3AddClass(x[i], "show");
        console.log("showing " + x[i].id+ " by .id");
      }
    }
  }
  li = document.querySelectorAll('li.show');   //obtaining the new visible list after the subfilters check
  for (var i = 0;  i < li.length; i++) { li[i].classList.add("show");}
}

function showHand() {
  console.log("cardsInHand: " + cardsInHand);
  x = document.querySelectorAll('li.filterDiv');
  for (i = 0; i < x.length; i++) {
    w3RemoveClass(x[i], "show");
    if (x[i].querySelector(".number") != null) {
      var rawNumber = x[i].querySelector(".number").textContent.substring(1);
      if (cardsInHand.has(rawNumber)) {
        w3AddClass(x[i], "show");
        w3RemoveClass(x[i], "unplayable-card");
        if (isPlayable(rawNumber) == false) {
          w3AddClass(x[i], "unplayable-card");
        }
        console.log("showing " + x[i].querySelector(".number").textContent + " by .number");
      }
    } else {
      if (cardsInHand.has(x[i].id)) {
        w3AddClass(x[i], "show");
        console.log("showing " + x[i].id+ " by .id");
      }
    }
  }
  li = document.querySelectorAll('li.show');   //obtaining the new visible list after the subfilters check
  for (var i = 0;  i < li.length; i++) { li[i].classList.add("show");}
}

function undo() {
  if (log_current.length > 1) {  
    var resp = confirm("Do you really want to UNDO the following action?\n" + log_current[log_current.length - 1][0]);
    if (resp == false) {
      return;
    }

    var lastAction = log_current.pop();
    var stateBeforeLastAction = log_current[log_current.length - 1];
    resourceValue = stateBeforeLastAction[1];
    resourceProduction = stateBeforeLastAction[2];
    terraformingValue = stateBeforeLastAction[3];
    refreshScreen();
    alert("Undone the last action:\n" + lastAction[0] + ".\n\n** Undo only reverts resource, production, and terraforming. Other changes are not tracked.");
  } else {
    alert("This is the start of the current stage. Cannot undo anymore.")
  }
}

function toggleResEditDiv(id) {
  // alert("toggleResEditDiv invoked");
  document.getElementById(id + "_edit").classList.toggle("active");
  if (document.getElementById(id + "_edit").classList.contains("active")) {
    document.getElementById(id + "_edit").style.display = "inline-block";
    // alert("changed to block-inline");
  } else {
    document.getElementById(id + "_edit").style.display = "none";
  }
}

function updateSteelWorth(changeVal) {
  newAmount = worth_Steel + parseInt(changeVal);
  if (newAmount < 0) {
    return;
  }
  worth_Steel = newAmount;
  document.getElementById("steel_worth").innerHTML = newAmount;
  log_current.push(["Steel is now worth: " + newAmount, resourceValue.slice(0), resourceProduction.slice(0), terraformingValue.slice(0)]);
}

function updateTitaniumWorth(changeVal) {
  newAmount = worth_Titanium + parseInt(changeVal);
  if (newAmount < 0) {
    return;
  }
  worth_Titanium = newAmount;
  document.getElementById("titanium_worth").innerHTML = newAmount;
  log_current.push(["Titanium is now worth: " + newAmount, resourceValue.slice(0), resourceProduction.slice(0), terraformingValue.slice(0)]);
}

function updatePlantWorth(changeVal) {
  newAmount = worth_Plant + parseInt(changeVal);
  if (newAmount < 0) {
    return;
  }
  worth_Plant = newAmount;
  document.getElementById("plant_worth").innerHTML = newAmount;
  log_current.push(["A tree now costs " + newAmount + " plants. ", resourceValue.slice(0), resourceProduction.slice(0), terraformingValue.slice(0)]);
}

function updateRes(resType, changeVal) {
  var resIdx = resourceTypesSmallToIdx[resType];
  newAmount = resourceValue[resIdx] + parseInt(changeVal);
  if (newAmount < 0) {
    return;
  }
  resourceValue[resIdx] = newAmount;
  document.getElementById(resType).innerHTML = newAmount;
}

function produce() {
  resourceTypesSmall.forEach(function (type, index) {
    resourceValue[index] += resourceProduction[index];
  });
  resourceValue[resourceTypeToIdx["MC"]] += terraformingValue[terraformingTypesToIdx["TR"]]

  log_all.push(log_current.slice(0));
  log_current = [["Produce", resourceValue.slice(0), resourceProduction.slice(0), terraformingValue.slice(0)]];
  console.log(log_all);
  refreshScreen();
}

function updateProd(id) {
  resourceTypesSmall.forEach(function (type, index) {
    resourceProduction[index] = Number(document.getElementById("prod_" + type).value);
  });
  // prod_mc = document.getElementById("prod_mc").value;
  // prod_steel = document.getElementById("prod_steel").value;
  // prod_titanium = document.getElementById("prod_titanium").value;
  // prod_plant = document.getElementById("prod_plant").value;
  // prod_energy = document.getElementById("prod_energy").value;
  // prod_heat = document.getElementById("prod_heat").value;
}

function updateTerraforming(type, newVal) {
  // console.log("Update terraforming called. type: " + type + " newVal: " + newVal)
  var index = terraformingTypesSmallToIdx[type];
  if (newVal > terraformingMax[index]) {
    alert ("Terraforming over the max.");
    return;
  }
  terraformingValue[index] = newVal;
  document.getElementById("terraforming_" + type).value = terraformingValue[index];
  if (type != "tr") {
    document.getElementById("terraforming_" + type + "_slider").value = terraformingValue[index];
  }
}

function updatePay(resType, changeVal) {
  payAmount = document.getElementById("payBy" + resType + "Amount").innerHTML;
  newAmount = parseInt(payAmount) + parseInt(changeVal);

  if (newAmount < 0) {
    alert ("Can't use negative resource!");
    return;
  } else if (parseInt(changeVal) > 0 && document.getElementById("payByMCAmount").innerHTML == 0) {
    alert ("No need to use more than necessary!");
    return;
  }
  var index;
  for (index = 0; index < resourceTypes.length; index++) {
    if (resourceTypes[index] == resType) {
      if (resourceValue[index] < newAmount) {
        alert ("Not enough resource!");
        return;
      }
    }
  }

  document.getElementById("payBy" + resType + "Amount").innerHTML = newAmount;
  
  steelPayAmount = document.getElementById("payBySteelAmount").innerHTML;
  titaniumPayAmount = document.getElementById("payByTitaniumAmount").innerHTML;
  remainingCost = projCardForPromotion.cost - steelPayAmount * worth_Steel - titaniumPayAmount * worth_Titanium;
  document.getElementById("payByMCAmount").innerHTML = Math.max(0, remainingCost);
}

function buyAndSave(price) {
  if (projCardForPromotion == null) {
    alert ("Error. No card is selected for purchase.");
    return;
  } else if (cardsInHand.has(projCardForPromotion.number)) {
    alert ("This card is already in hand.");
    return;
  }

  // Pay the price.
  resourceValue[resourceTypeToIdx["MC"]] -= price;
  log_current.push(["Bought a proj card: " + projCardForPromotion.title, resourceValue.slice(0), resourceProduction.slice(0), terraformingValue.slice(0)]);

  // Add to hand set.
  cardsInHand.add(projCardForPromotion.number);
  document.getElementById("paymentFooter").style.display = "none";
  refreshScreen();
}

function sellCard() {
  resourceValue[resourceTypeToIdx["MC"]] += 1;
  cardsInHand.delete(projCardForPromotion.number);
  refreshScreen();
}

function payAndPromote() {
  if (projCardForPromotion == null) {
    alert ("Error. No card is selected for promotion.");
    return;
  }

  // Check if any production other than MC goes negative
  if (typeof projCardForPromotion.production !== 'undefined') {
    for (var resType of Object.keys(projCardForPromotion.production)) {
      var resIndex = resourceTypeToIdx[resType];
      if (resIndex > 0 && 
          0 > resourceProduction[resIndex] + parseInt(projCardForPromotion.production[resType])) {
        alert ("Can't play this card. The production of " + resType + " cannot go negative.");
        return;
      }
    }
  }
  if (resourceValue[resourceTypeToIdx["MC"]] < document.getElementById("payByMCAmount").innerHTML) {
    alert("Can't play this card. Not enough money.");
    return;
  }


  var logStr = "PaidAndPromoted " + projCardForPromotion.title + " using ";

  // Pay for the card
  resourceValue[resourceTypeToIdx["MC"]] -= document.getElementById("payByMCAmount").innerHTML;
  logStr += document.getElementById("payByMCAmount").innerHTML + " MC, ";
  resourceValue[resourceTypeToIdx["Steel"]] -= document.getElementById("payBySteelAmount").innerHTML;
  logStr += document.getElementById("payBySteelAmount").innerHTML + " Steel, ";
  resourceValue[resourceTypeToIdx["Titanium"]] -= document.getElementById("payByTitaniumAmount").innerHTML;
  logStr += document.getElementById("payByTitaniumAmount").innerHTML + " Titanium ";

  // Update resource & production
  if (typeof projCardForPromotion.resource !== 'undefined') {
    for (var resType of Object.keys(projCardForPromotion.resource)) {
      var resIndex = resourceTypeToIdx[resType];
      resourceValue[resIndex] += parseInt(projCardForPromotion.resource[resType]);
      logStr += "; Gained " + projCardForPromotion.resource[resType] + " " + resType;
    }
  }
  if (typeof projCardForPromotion.production !== 'undefined') {
    for (var resType of Object.keys(projCardForPromotion.production)) {
      var resIndex = resourceTypeToIdx[resType];
      resourceProduction[resIndex] += parseInt(projCardForPromotion.production[resType]);
      logStr += "; Increased " + projCardForPromotion.production[resType] + " " + resType + " production";
    }
  }

  // Perform terraforming
  if (typeof projCardForPromotion.terraforming !== 'undefined') {
    for (var type of Object.keys(projCardForPromotion.terraforming)) {
      var i = terraformingTypesToIdx[type];
      newVal = Math.min(terraformingMax[i], terraformingValue[i] + terraformingStep[i] * parseInt(projCardForPromotion.terraforming[type]));
      if (newVal == terraformingValue[i]) {
        continue;
      }
      var effectiveChange = (newVal - terraformingValue[i]) / terraformingStep[i];
      if (i > 0) { // Increment TR as well if type is NOT TR.
        terraformingValue[0] += effectiveChange;
        logStr += "; TR: " + terraformingValue[0] + " (+" + effectiveChange + ") ";
      }
      terraformingValue[i] = newVal;
      logStr += "; " + type + ": " + terraformingValue[i] + " (+" + effectiveChange * terraformingStep[i] + ") ";
    }
  }
  
  log_current.push([logStr, resourceValue.slice(0), resourceProduction.slice(0), terraformingValue.slice(0)]);
  cardsUsed.add(projCardForPromotion.number);
  cardsInHand.delete(projCardForPromotion.number);
  projCardForPromotion = null;
  document.getElementById("paymentFooter").style.display = "none";
  clearInput();
  refreshScreen();
}

function isPlayable(number) {
  if (number in projDataIndexed) {
    projCard = projDataIndexed[number];
    if (typeof projCard.cost == 'undefined') { // Prelude cards don't have any cost.
      return true;
    }

    availableMoney = resourceValue[0];
    if (typeof projCard.tag !== 'undefined' && projCard.tag.Building > 0) {
      availableMoney += resourceValue[1] * worth_Steel
    }
    if (typeof projCard.tag !== 'undefined' && projCard.tag.Space > 0) {
      availableMoney += resourceValue[2] * worth_Titanium
    }
    return availableMoney >= projCard.cost;
  } else {
    return false;
  }
}

//////////////////////PARSE function ////////////////////////////////
function parseURLParams(url) {
    var queryStart = url.indexOf("#") + 1,
        queryEnd   = url.indexOf("%") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1)
    cards = "#" + query.replace(/\#/g, " #").toUpperCase().split(" ");
    if (query === url || query === "") return "ALL";
    console.log(cards);
    return cards;
}

////////////////////// Display only pointed cards ///////////////////
function displayCardsOnly() {
  console.log("cards: " + cards);
  //showing only the pointed cards
  x = document.querySelectorAll('li.filterDiv');
  for (i = 0; i < x.length; i++) {
    if (x[i].querySelector(".number") != null) {
      if (cards.includes(x[i].querySelector(".number").textContent)) {
        w3AddClass(x[i], "show");
        console.log("showing " + x[i].querySelector(".number").textContent + "by .number");
      }
    } else {
      if (cards.includes(x[i].id)) {
        w3AddClass(x[i], "show");
        console.log("showing " + x[i].id+ "by .id");
      }
    }
  }
}

////////////////////// FILTER FUCTION ///////////////////////////////
function filterWrapperForSearch(event, id) {
  if (event.key === 'Enter') {
    filterFunction(id);
  } 
  // else {
  //   console.log("filtered filterFunction().. key was: " + event.key);
  // }
}

function filterFunction(id) {
  console.log("invoked filterFunction()");
  refreshUnplayableCard();
  var input, filter, ul, li, a, i, x;

  clickedElementID = document.getElementById(id);
  if (clickedElementID != null) {clickedElementID.classList.toggle("active");}

  x = document.querySelectorAll('.filterDiv');
  for (i = 0; i < x.length; i++) {w3AddClass(x[i], "show");}

  //filtering by Type + Tag + Deck + Reqs
  btnType = document.querySelectorAll('button.active.btn1');
  btnTag = document.querySelectorAll('button.active.btn2');
  btnDeck = document.querySelectorAll('button.active.btn3');
  btnReq = document.getElementById('reqs');
  btnVP = document.getElementById('vp');
  btnTile = document.querySelectorAll('button.active.btn-tile');


  btnProduction = document.querySelectorAll('button.active.btn-production');

  //filter by Card type
  if (btnType.length > 0) {
    for (i = 0; i < x.length; i++) {
      show = false;
      for (j = 0; j < btnType.length; j++) {
        if (x[i].className.indexOf(btnType[j].id) > -1) {
          show = true;
        }
        if (show == true) {w3AddClass(x[i], "show");}
        else {w3RemoveClass(x[i], "show");}
        }
    }
    x = document.querySelectorAll('li.show');
  }

  //filter by Tag
  if (btnTag.length > 0) {
    for (i = 0; i < x.length; i++) {
      show = false;
      for (j = 0; j < btnTag.length; j++) {
        if (x[i].className.indexOf(btnTag[j].id) > -1) {
          show = true;
        }
        if (show == true) {w3AddClass(x[i], "show");}
        else {w3RemoveClass(x[i], "show");}
        }
    }
    x = document.querySelectorAll('li.show');
  }

  //filter by Deck type
  if (btnDeck.length > 0) {
    for (i = 0; i < x.length; i++) {
      show = false;
      for (j = 0; j < btnDeck.length; j++) {
        if (x[i].className.indexOf(btnDeck[j].id) > -1) {
          show = true;
        }
        if (show == true) {w3AddClass(x[i], "show");}
        else {w3RemoveClass(x[i], "show");}
        }
    }
    x = document.querySelectorAll('li.show');
  }

  //filter by Requirements
  if (btnReq.classList.contains("active")) {
    for (i = 0; i < x.length; i++) {
        if (x[i].className.indexOf(btnReq.id) > -1) {w3AddClass(x[i], "show");}
        else {w3RemoveClass(x[i], "show");}
        }
    x = document.querySelectorAll('li.show');
  } else {
    document.getElementById("subfilterReqs").classList.add("subfilterReqs-disabled"); //to disble the subfilters
  }

  //filter by VP
  if (btnVP.classList.contains("active")) {
    for (i = 0; i < x.length; i++) {
        if (x[i].querySelectorAll(".points").length > 0) {w3AddClass(x[i], "show");}
        else {w3RemoveClass(x[i], "show");}
      }
    x = document.querySelectorAll('li.show');
  }

  //filter by tiles
  if (btnTile.length > 0)  {
    for (i = 0; i < x.length; i++) {
      show = false;
      for (j = 0; j < btnTile.length; j++) {
        if (x[i].querySelectorAll(".tile." + btnTile[j].id).length > 0) {
          show = true;
        }
        if (show == true) {w3AddClass(x[i], "show");}
        else {w3RemoveClass(x[i], "show");}
        }
    }
    x = document.querySelectorAll('li.show');
  }


  //filter by production
  if (btnProduction.length > 0)  {
    for (i = 0; i < x.length; i++) {
      show = false;
      for (j = 0; j < btnProduction.length; j++) {
        if (x[i].querySelectorAll(btnProduction[j].id).length > 0) {
          show = true;
        }
        if (show == true) {w3AddClass(x[i], "show");}
        else {w3RemoveClass(x[i], "show");}
        }
    }
    x = document.querySelectorAll('li.show');
  }


  //filter by price
  priceValue = document.getElementById("price").value;
  if (priceValue < 0) {document.getElementById("price").value = 0;}
  if (priceValue > 50) {document.getElementById("price").value = 50;}
  if (priceValue > 0) {
    for (i = 0; i < x.length; i++) {
        if (x[i].querySelector(".price") == null) {cardValue = 0;}
        else {cardValue = parseInt(x[i].querySelector(".price").textContent);}
        if (cardValue >= priceValue) {w3AddClass(x[i], "show");}
        else {w3RemoveClass(x[i], "show");}
      }
    x = document.querySelectorAll('li.show');
  }

  //Filtering for the Requirements inputs
  if (document.getElementById("reqs").classList.contains("active")) {
    document.getElementById("subfilterReqs").classList.remove("subfilterReqs-disabled"); //enabling the subfilters
    li = document.querySelectorAll('li.show');
    //Requirements input filtering
    temperatureValue = document.getElementById("slider1").value;
    oxygenValue = document.getElementById("slider2").value;
    oceansValue = document.getElementById("slider3").value;
    venusValue = document.getElementById("slider4").value;
    scienceValue = document.getElementById("slider5").value;
    jovianValue = document.getElementById("slider6").value;
    venusTagValue = document.getElementById("slider7").value;
    earthValue = document.getElementById("slider8").value;

    if ( temperatureValue > -30 || oxygenValue > 0 || oceansValue > 0 || venusValue > 0 || scienceValue > 0
      || jovianValue > 0 || venusTagValue > 0 || earthValue > 0) {
      for (i = 0; i < x.length; i++) {

        //obtaining the data without writing over it
        temperatureData = parseInt(li[i].dataset.temperature);
        oxygenData = parseInt(li[i].dataset.oxygen);
        oceansData = parseInt(li[i].dataset.oceans);
        venusData = parseInt(li[i].dataset.venus);
        scienceData = parseInt(li[i].dataset.science);
        jovianData = parseInt(li[i].dataset.jovian);
        venusTagData = parseInt(li[i].dataset.venustag);
        earthData = parseInt(li[i].dataset.earth);



        show = false;
        if (temperatureValue > -30) {
          if ( temperatureValue <= temperatureData ) { show = true;}
        }
        if (oxygenValue > 0 && oxygenData > 0) {
          if ( oxygenValue <= oxygenData ) { show = true;}
        }
        if (oceansValue > 0) {
          if ( oceansValue <= oceansData ) { show = true }
        }
        if (venusValue > 0 ) {
          if ( venusValue <= venusData ) { show = true }
        }
        if (scienceValue > 0 ) {
          if ( scienceValue <= scienceData ) { show = true }
        }
        if (jovianValue > 0 ) {
          if ( jovianValue <= jovianData ) { show = true }
        }
        if (venusTagValue > 0 ) {
          if ( venusTagValue <= venusTagData ) { show = true }
        }
        if (earthValue > 0 ) {
          if ( earthValue <= earthData ) { show = true }
        }

        //the check
        if (show) {w3AddClass(li[i], "show");}
        else {w3RemoveClass(li[i], "show");}
      }
    }
  } else {
    //to clear the inputs when the Requirements button is canceled
    document.getElementById("slider1").value = -30;
    document.getElementById("output1").innerHTML = -30;
    document.getElementById("slider2").value = 0;
    document.getElementById("output2").innerHTML = 0;
    document.getElementById("slider3").value = 0;
    document.getElementById("output3").innerHTML = 0;
    document.getElementById("slider4").value = 0;
    document.getElementById("output4").innerHTML = 0;
    document.getElementById("slider5").value = 0;
    document.getElementById("output5").innerHTML = 0;
    document.getElementById("slider6").value = 0;
    document.getElementById("output6").innerHTML = 0;
  }

///////////////////////////////////////////////////////////////////////////////

  //Text input filtering
  li = document.querySelectorAll('li.show');   //obtaining the new visible list after the subfilters check
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  filter = filter.split(" ");
  for (i = 0;  i < li.length; i++) {
    display = true;
    for (j = 0;  j < filter.length; j++) {
      if (li[i].innerHTML.toUpperCase().indexOf(filter[j]) > -1) {}
      else {display = false;}
        }
    if (display) {
        li[i].classList.add("show");
      } else { li[i].classList.remove("show");}
  }

  //Display Cards Numbers
  displayedCards = document.querySelectorAll('li.show').length;
  displayedCorporations = document.querySelectorAll('li.show.corporation').length;
  displayedPreludes = document.querySelectorAll('li.show.prelude-card').length;
  displayedColonies = document.querySelectorAll('li.show.colony-card').length;
  displayedGlobals = document.querySelectorAll('li.show.global-card').length;

  displayedProjects = displayedCards - displayedCorporations - displayedPreludes - displayedColonies - displayedGlobals;
  // document.getElementById("totalProjects").innerHTML = displayedProjects;
  // document.getElementById("totalCorporations").innerHTML = displayedCorporations;
  // document.getElementById("totalPreludes").innerHTML = displayedPreludes;
  // document.getElementById("totalColonies").innerHTML = displayedColonies;
  // document.getElementById("totalGlobals").innerHTML = displayedGlobals;

}


function clearInput() {
  document.getElementById("myInput").value = ""; //resets the text input
  document.getElementById("price").value = 0;
  document.getElementById("contentFilters").style.display = "none"; //hides the range inputs div
  document.getElementById("subfilterReqs").style.display = "none"; //hides the range inputs div
  // document.getElementById("btn-selectedCards").classList.toggle("disabled") //hide the selected cards button


  //resets the range inputs
  document.getElementById("slider1").value = -30;
  document.getElementById("output1").innerHTML = -30;
  document.getElementById("slider2").value = 0;
  document.getElementById("output2").innerHTML = 0;
  document.getElementById("slider3").value = 0;
  document.getElementById("output3").innerHTML = 0;
  document.getElementById("slider4").value = 0;
  document.getElementById("output4").innerHTML = 0;
  document.getElementById("slider5").value = 0;
  document.getElementById("output5").innerHTML = 0;
  document.getElementById("slider6").value = 0;
  document.getElementById("output6").innerHTML = 0;
  document.getElementById("slider7").value = 0;
  document.getElementById("output7").innerHTML = 0;
  document.getElementById("slider8").value = 0;
  document.getElementById("output8").innerHTML = 0;

  //shrinks any expanded AREAS
  document.getElementById("buttonsContainer-body").style.height = CONTAINER + "px";
  document.getElementById("contentFilters").style.height = CONTENT_FILTERS + "px";
  containerHeight = CONTAINER;
  contentFiltersCurrent = CONTENT_FILTERS;

  // clear any selected cards
  selectedCardsAmount = 0;
  x = document.querySelectorAll(".clicked-card");
  for (i = 0; i < x.length; i++) {w3RemoveClass(x[i], "clicked-card");}
  selectedCards = "";
}

function w3AddClass(element, name) {
  var i, arr1, arr2;
  arr1 = element.className.split(" ");
  arr2 = name.split(" ");
  for (i = 0; i < arr2.length; i++) {
    if (arr1.indexOf(arr2[i]) == -1) {
      element.className += " " + arr2[i];
    }
  }
}

function w3RemoveClass(element, name) {
  var i, arr1, arr2;
  arr1 = element.className.split(" ");
  arr2 = name.split(" ");
  for (i = 0; i < arr2.length; i++) {
    while (arr1.indexOf(arr2[i]) > -1) {
      arr1.splice(arr1.indexOf(arr2[i]), 1);
    }
  }
  element.className = arr1.join(" ");
}


//toggle Content filters
function toggleContentDiv() {
  document.getElementById("content").classList.toggle("active");
  if (document.getElementById("content").classList.contains("active")) {
    containerHeight = containerHeight + contentFiltersCurrent +30; //30 for the margins
    document.getElementById("buttonsContainer-body").style.height = containerHeight + "px";
    setTimeout(function(){$("#contentFilters").fadeIn(200);}, 100);
  }
  else {
    containerHeight = containerHeight - contentFiltersCurrent -30;
    document.getElementById("contentFilters").style.display = "none"; //hides the range inputs div
    document.getElementById("buttonsContainer-body").style.height = containerHeight + "px";
  }
}
//toggle Footer
function toggleFooterDiv() {
  if ($('#footer:visible').length == 0) {
    containerHeight = containerHeight + 100;
    document.getElementById("buttonsContainer-body").style.height = containerHeight + "px";
    setTimeout(function(){$("#footer").fadeIn(200);}, 100);
  }
  else {
    containerHeight = containerHeight - 100;
    document.getElementById("buttonsContainer-body").style.height = containerHeight + "px";
  }
}

//toggle Requerements filters
function toggleRequirementsFilters() {
  document.getElementById("subfilterReqs").classList.toggle("active");
  if ($('#subfilterReqs:visible').length == 0) {
    contentFiltersCurrent = contentFiltersCurrent + 105;
    containerHeight = containerHeight + 105;
    document.getElementById("buttonsContainer-body").style.height = containerHeight + "px";
    document.getElementById("contentFilters").style.height = contentFiltersCurrent + "px";
    setTimeout(function(){$("#subfilterReqs").fadeIn(200);}, 100);
  }
  else {
    containerHeight = containerHeight -105;
    contentFiltersCurrent = contentFiltersCurrent -105;
    document.getElementById("subfilterReqs").style.display = "none";
    document.getElementById("contentFilters").style.height = CONTENT_FILTERS + "px";
    document.getElementById("buttonsContainer-body").style.height = containerHeight + "px";
  }
}

var design = 1;
function toggleCardsDesign() {
  if (design == 1) {stackedCards(); design = 2;}
  else {casualCards(); design = 1;}
}

function casualCards() {
    $('.colonyCards').css("margin-right", 40);
    $('.colonyCards').css("margin-left", -20);

    cards = document.querySelectorAll('.filterDiv');
    for (i = 0; i < cards.length; i++) {
        cards[i].classList.remove("filterDiv-stacked");
    }
    tables = document.querySelectorAll('.myUL');
    for (i = 0; i < tables.length; i++) {
        tables[i].style.width = "auto";
        tables[i].style.margin = "15px 0px 0px 25px";
    }
    tableTitles = document.querySelectorAll('.ul-title');
    for (i = 0; i < tableTitles.length; i++) {
        tableTitles[i].style.margin = "0px 0px 0px -25px";
    }
}

function stackedCards() {
    $('.colonyCards').css("margin-right", -200);
    $('.colonyCards').css("margin-left", 15);

    cards = document.querySelectorAll('.filterDiv');
    for (i = 0; i < cards.length; i++) {
        cards[i].classList.add("filterDiv-stacked");
    }
    tables = document.querySelectorAll('.myUL');
    for (i = 0; i < tables.length; i++) {
      tables[i].style.width = "85%";
      tables[i].style.margin = "15px 0px 0px -25px";
    }
    tableTitles = document.querySelectorAll('.ul-title');
    for (i = 0; i < tableTitles.length; i++) {
        tableTitles[i].style.margin = "15px 0px 0px 25px";
    }
}

function reduceOne() {
  price = document.getElementById("price");
  priceValue = document.getElementById("price").value;
  if (priceValue > 0) {
    priceValue--;
    price.value = priceValue;
    filterFunction();
  }
}

function increaseOne() {
  price = document.getElementById("price");
  priceValue = document.getElementById("price").value;
  if (priceValue<50) {
    priceValue++;
    price.value = priceValue;
    filterFunction();
  }
}

function sortByPriceUp() {
  // get array of elements
    var myArray = document.querySelectorAll('li.automated, li.events, li.active');
    var count = 0;
    // sort based on timestamp attribute
    myArray = [].slice.call(myArray);
    myArray.sort(function (a, b) {
    // convert to integers from strings
    a = parseInt($(a).find(".price").text(), 10);
    if (a == null) {a = 0}
    b = parseInt($(b).find(".price").text(), 10);
    if (b == null) {b = 0}
    count += 2;
    // compare
    if(a > b) {
        return 1;
    } else if(a < b) {
        return -1;
    } else {
        return 0;
    }
  });
  // put sorted results back on page
  $("#projectCards").append(myArray);
}

function sortByPriceDown() {
  // get array of elements
    var myArray = document.querySelectorAll('li.automated, li.events, li.active');
    var count = 0;
    // sort based on timestamp attribute
    myArray = [].slice.call(myArray);
    myArray.sort(function (a, b) {
    // convert to integers from strings
    a = parseInt($(a).find(".price").text(), 10);
    if (a == null) {a = 0}
    b = parseInt($(b).find(".price").text(), 10);
    if (b == null) {b = 0}
    count += 2;
    // compare
    if(a < b) {
        return 1;
    } else if(a > b) {
        return -1;
    } else {
        return 0;
    }
  });
  // put sorted results back on page
  $("#projectCards").append(myArray);
}

function sortByID() {
  // get array of elements
    var myArray = document.querySelectorAll('li.automated, li.events, li.active');
    var count = 0;
    // sort based on timestamp attribute
    myArray = [].slice.call(myArray);
    myArray.sort(function (a, b) {
    // convert to integers from strings
    a = parseInt($(a).find(".number").text(), 10);
    if (a == null) {a = 0}
    b = parseInt($(b).find(".number").text(), 10);
    if (b == null) {b = 0}
    count += 2;
    // compare
    if(a > b) {
        return 1;
    } else if(a < b) {
        return -1;
    } else {
        return 0;
    }
  });
  // put sorted results back on page
  $("#projectCards").append(myArray);
}

function toggleActive(id) {
  clickedElementID = document.getElementById(id);
  clickedElementID.classList.toggle("button2-active");
  setTimeout(function(){clickedElementID.classList.toggle("button2-active");}, 300);
}


function getClickedCard() {
  var clickedCard;
  $(document).click(function(event) {
    clickedCard = event.target.closest("li");
  });
  setTimeout(function(){selectCard(clickedCard), 100;});
}

function selectCard (clickedCard) {
  //works only if the controller is visible
  if ($('#buttonsContainer:visible').length > 0) {

    //adding or removing the clicked card number or id to the string
    if (clickedCard.querySelector(".number") != null) {
      selectedCardNumber = clickedCard.querySelector(".number").textContent;
    }
    else {
      selectedCardNumber = clickedCard.id;
    }
    // alert (selectedCardNumber.substring(1))

    //change the shadow of the clicked card
    clickedCard.classList.toggle("clicked-card");
    if (lastClickedCard != null && lastClickedCard != clickedCard) {
      w3RemoveClass(lastClickedCard, "last-clicked-card");
    }
    lastClickedCard = clickedCard
    clickedCard.classList.toggle("last-clicked-card");
    
    if (selectedCardNumber.substring(1) in projDataIndexed) {
      projCard = projDataIndexed[selectedCardNumber.substring(1)];
      projCardForPromotion = projCard
        if (typeof projCard.cost == 'undefined') { // Prelude cards don't have any cost.
          projCard['cost'] = 0
        }

        // alert (projCard.title);
        if (clickedCard.classList.contains("last-clicked-card")) {
          document.getElementById("paymentFooter").style.display = "block";
        } else {
          document.getElementById("paymentFooter").style.display = "none";
        }

        if (cardsInHand.has(projCard.number)) {
          document.getElementById("buyAndSave").style.display = "none";
          document.getElementById("saveCard").style.display = "none";
          document.getElementById("sellCard").style.display = "inline-block";
        } else {
          document.getElementById("buyAndSave").style.display = "inline-block";
          document.getElementById("saveCard").style.display = "inline-block";
          document.getElementById("sellCard").style.display = "none";
        }
        
        // document.getElementById("paymentCardTitle").innerHTML = "Wanna promote \"" + projCard.title + "\" ?<BR>";
        document.getElementById("paymentCardTitle").innerHTML = projCard.title + "<BR>";
        document.getElementById("paymentCardCost").innerHTML = projCard.cost;
        remainingCost = projCard.cost;
        if (typeof projCard.tag !== 'undefined' && projCard.tag.Building > 0) {
          document.getElementById("payBySteel").style = "display: block"; 
          steelPayAmount = Math.min(resourceValue[1], Math.floor(remainingCost / worth_Steel))
          remainingCost -= steelPayAmount * worth_Steel
          document.getElementById("payBySteelAmount").innerHTML = steelPayAmount;//  + ' (' + steelPayAmount * worth_Steel + ' in M\$)';
        } else {
          document.getElementById("payBySteel").style = "display: none"; 
          document.getElementById("payBySteelAmount").innerHTML = 0
        }
        if (typeof projCard.tag !== 'undefined' && projCard.tag.Space > 0) {
          document.getElementById("payByTitanium").style = "display: block"; 
          titaniumPayAmount = Math.min(resourceValue[2], Math.floor(remainingCost / worth_Titanium))
          remainingCost -= titaniumPayAmount * worth_Titanium
          document.getElementById("payByTitaniumAmount").innerHTML = titaniumPayAmount;// + ' (' + titaniumPayAmount * worth_Titanium + ' in M\$)';
        } else {
          document.getElementById("payByTitanium").style = "display: none"; 
          document.getElementById("payByTitaniumAmount").innerHTML = 0;
        }

        document.getElementById("payByMCAmount").innerHTML = remainingCost;
        
        if (typeof projCard.outcome !== 'undefined') {
          document.getElementById("manualActionPanel").style.display = "block";
          document.getElementById("payDisplayOutcome").innerHTML = projCard.outcome;
        } else {
          document.getElementById("manualActionPanel").style.display = "none";
          document.getElementById("payDisplayOutcome").innerHTML = "";
        }
        cardForPromotion = projCard;
    }

    // projData.forEach(function (projCard, index) {
    //   if (projCard.number == selectedCardNumber.substring(1)) {
    //     // console.log(projCard, index);
    //     projCardForPromotion = projCard
    //     if (typeof projCard.cost == 'undefined') { // Prelude cards don't have any cost.
    //       projCard['cost'] = 0
    //     }

    //     // alert (projCard.title);
    //     if (clickedCard.classList.contains("last-clicked-card")) {
    //       document.getElementById("paymentFooter").style.display = "block";
    //     } else {
    //       document.getElementById("paymentFooter").style.display = "none";
    //     }
        
    //     // document.getElementById("paymentCardTitle").innerHTML = "Wanna promote \"" + projCard.title + "\" ?<BR>";
    //     document.getElementById("paymentCardTitle").innerHTML = projCard.title + "<BR>";
    //     document.getElementById("paymentCardCost").innerHTML = projCard.cost;
    //     remainingCost = projCard.cost;
    //     if (typeof projCard.tag !== 'undefined' && projCard.tag.Building > 0) {
    //       document.getElementById("payBySteel").style = "display: block"; 
    //       steelPayAmount = Math.min(resourceValue[1], Math.floor(remainingCost / worth_Steel))
    //       remainingCost -= steelPayAmount * worth_Steel
    //       document.getElementById("payBySteelAmount").innerHTML = steelPayAmount;//  + ' (' + steelPayAmount * worth_Steel + ' in M\$)';
    //     } else {
    //       document.getElementById("payBySteel").style = "display: none"; 
    //       document.getElementById("payBySteelAmount").innerHTML = 0
    //     }
    //     if (typeof projCard.tag !== 'undefined' && projCard.tag.Space > 0) {
    //       document.getElementById("payByTitanium").style = "display: block"; 
    //       titaniumPayAmount = Math.min(resourceValue[2], Math.floor(remainingCost / worth_Titanium))
    //       remainingCost -= titaniumPayAmount * worth_Titanium
    //       document.getElementById("payByTitaniumAmount").innerHTML = titaniumPayAmount;// + ' (' + titaniumPayAmount * worth_Titanium + ' in M\$)';
    //     } else {
    //       document.getElementById("payByTitanium").style = "display: none"; 
    //       document.getElementById("payByTitaniumAmount").innerHTML = 0;
    //     }

    //     document.getElementById("payByMCAmount").innerHTML = remainingCost;
        
    //     if (typeof projCard.outcome !== 'undefined') {
    //       document.getElementById("manualActionPanel").style.display = "block";
    //       document.getElementById("payDisplayOutcome").innerHTML = projCard.outcome;
    //     } else {
    //       document.getElementById("manualActionPanel").style.display = "none";
    //       document.getElementById("payDisplayOutcome").innerHTML = "";
    //     }
    //     cardForPromotion = projCard;
    //   }
    // });

    if (selectedCards.indexOf(selectedCardNumber) >= 0) {
      selectedCards = selectedCards.replace(selectedCardNumber, "");
      selectedCardsAmount--;
    }
    else {
      selectedCards = selectedCards + selectedCardNumber;
      selectedCardsAmount++;
    }

    //showing or removing the CTA button and updating its url
    // if (selectedCards.length > 0) {
    //   document.getElementById("btn-selectedCards").href = "https://ssimeonoff.github.io/cards-list" + selectedCards;
    //   document.getElementById("selectedCardsAmount").innerHTML = selectedCardsAmount;
    //   document.getElementById("btn-selectedCards").classList.remove("disabled");
    //   document.getElementById("btn-selectedCards").disabled = false;
    // }
    // else {
    //   document.getElementById("btn-selectedCards").classList.add("disabled");
    //   document.getElementById("btn-selectedCards").disabled = true;
    //   document.getElementById("selectedCardsAmount").innerHTML = selectedCardsAmount;
    // }

  }
}

function zoomSingleCard() {
  if (cards.length == 1) {
    document.getElementById(cards[0]).style.transform = "scale(0)";
    document.getElementById(cards[0]).style.transition = "0.3s";
    document.getElementById(cards[0]).style.marginLeft = "32%";
    document.getElementById(cards[0]).style.marginTop = "200px";
    setTimeout(function() {document.getElementById(cards[0]).style.transform = "scale(2)";}, 500);

  }
}
