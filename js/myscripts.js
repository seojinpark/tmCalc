
CONTAINER = 200; //the default height of the buttons container
CONTENT_FILTERS = 125 //the default height of the Content filters area
var containerHeight = CONTAINER; //the current height of the buttons container
var contentFiltersCurrent = CONTENT_FILTERS;
var selectedCards = "";
var selectedCardsAmount = 0;

var projData = [];
function loadCardData(path) {
  var request = new XMLHttpRequest();
  request.open("GET", path, false);
  request.send(null);
  projData = projData.concat(JSON.parse(request.responseText));
}
loadCardData("textData/proj.json")
loadCardData("textData/preludeCards.json")
loadCardData("textData/corp.json")
loadCardData("textData/corp_prelude.json")
loadCardData("textData/proj_standard.json")

var projDataIndexed = {};
projData.forEach(function (projCard, index) {
  projDataIndexed[projCard.number] = projCard;
});

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  // element.setAttribute('href', 'data:application/octet-stream;charset=utf-8' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.setAttribute('target', "_blank");

  element.style.display = 'none';
  element.target = "_blank"
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function save() {
  var stateInJson = snapshot(false);
  download('tmCalc.json', stateInJson);
}

function getURL() {
  var stateInJson = snapshot(true);
  var element = document.createElement('a');
  element.setAttribute('href', origin + "#" + encodeURIComponent(stateInJson));
  element.setAttribute('target', "_blank");

  element.style.display = 'none';
  element.target = "_blank"
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function snapshot(truncLog) {
  var state = {}
  state["resourceValue"] = resourceValue;
  state["resourceProduction"] = resourceProduction;
  state["worth_Steel"] = worth_Steel;
  state["worth_Titanium"] = worth_Titanium;
  state["worth_Plant"] = worth_Plant;
  state["worth_Heat"] = worth_Heat;
  state["proj_discount"] = proj_discount;
  state["proj_rebate"] = proj_rebate;
  state["vp"] = vp;
  state["terraformingValue"] = terraformingValue;
  state["tagsPlayed"] = tagsPlayed;
  state["tagsDisplayed"] = tagsDisplayed;
  state["discountByTag"] = discountByTag;
  state["rebateByTag"] = rebateByTag;
  state["logdata"] = logdata;
  state["generation"] = generation;
  state["cardsInHand"] = Array.from(cardsInHand);
  state["cardsUsed"] = Array.from(cardsUsed);
  if (truncLog) {
    state["logdata"] = [];
  }
  var stateInJson = JSON.stringify(state);
  console.log(stateInJson);
  return stateInJson;
}

function loadState(stateInText) {
  var state = JSON.parse(stateInText);
  resourceValue = state["resourceValue"];
  resourceProduction =   state["resourceProduction"];
  worth_Steel =   state["worth_Steel"];
  worth_Titanium =   state["worth_Titanium"];
  worth_Plant =   state["worth_Plant"];
  worth_Heat =   state["worth_Heat"];
  proj_discount =   state["proj_discount"];
  proj_rebate =   state["proj_rebate"];
  vp =   state["vp"];
  terraformingValue =   state["terraformingValue"];
  tagsPlayed =   state["tagsPlayed"];
  tagsDisplayed =   state["tagsDisplayed"];
  discountByTag =   state["discountByTag"];
  rebateByTag =   state["rebateByTag"];
  logdata =   state["logdata"];
  generation =   state["generation"];
  cardsInHand =   new Set(state["cardsInHand"]);
  cardsUsed =   new Set(state["cardsUsed"]);
  alert("Completed loading data: \n" + stateInText);
  refreshScreen();
}

function loadFromFile() {
  var fileToUpload = $('#loadFromFile').prop('files')[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    // e.target.result should contain the text
    // console.log(e.target.result);
    loadState(e.target.result);
  };
  reader.readAsText(fileToUpload);
  // var data = reader.result;
}

function loadFromURL(url) {
  var queryStart = url.indexOf("#") + 1;
  var queryEnd   = url.length + 1;
  var stateInText = decodeURIComponent(url.slice(queryStart, queryEnd - 1));
  if (stateInText === url || stateInText === "") {
    return url;
  } else {
    console.log("StateInText:\n" + stateInText);
    loadState(stateInText);
    return url.slice(0, queryStart - 1);
  }
}

var resourceTypes = ['MC', 'Steel', 'Titanium', 'Plant', 'Energy', 'Heat'];
var resourceTypeToIdx = {'MC': 0, 'M\$': 0, 'Steel': 1, 'Titanium': 2, 'Plant': 3, 'Energy': 4, 'Heat': 5};
var resourceTypesSmall = ['mc', 'steel', 'titanium', 'plant', 'energy', 'heat'];
var resourceTypesSmallToIdx = {'mc': 0, 'm\$': 0, 'steel': 1, 'titanium': 2, 'plant': 3, 'energy': 4, 'heat': 5};
var resourceValue = [0, 0, 0, 0, 0, 0]; //var resourceValue = [42, 10, 5, 0, 0, 0];
var resourceProduction = [0, 0, 0, 0, 0, 0];
var worth_Steel = 2;
var worth_Titanium = 3;
var worth_Plant = 8;
var worth_Heat = 1;
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

var tagsPlayed = { "Earth": 0, "Jovian": 0, "Space": 0, "Event": 0, "City": 0, "Building": 0, "Power": 0, "Science": 0, "Plant": 0, "Animal": 0, "Microbe": 0, "Wild": 0 };
var tagsDisplayed = { "Earth": 0, "Jovian": 0, "Space": 0, "Event": 0, "City": 0, "Building": 0, "Power": 0, "Science": 0, "Plant": 0, "Animal": 0, "Microbe": 0, "Wild": 0 };
var discountByTag = { "Earth": 0, "Jovian": 0, "Space": 0, "Event": 0, "City": 0, "Building": 0, "Power": 0, "Science": 0, "Plant": 0, "Animal": 0, "Microbe": 0, "Wild": 0, "AnyProjCard": 0, "StandardProj": 0 }; //TODO: implement
var rebateByTag = { "Earth": 0, "Jovian": 0, "Space": 0, "Event": 0, "City": 0, "Building": 0, "Power": 0, "Science": 0, "Plant": 0, "Animal": 0, "Microbe": 0, "Wild": 0, "AnyProjCard": 0, "StandardProj": 0 }; //TODO: implement
var logdata = []
var generation = 1
var cardsInHand = new Set();
var cardsUsed = new Set();
var lastClickedCard = null;

//parse the url
urlString = window.location.href;
origin = loadFromURL(urlString);
console.log(origin);
// cards = parseURLParams(urlString);
cards = "ALL"

//display all card or only few ones if pointed
if (cards == "ALL") {showAll(); showCorp();}
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
}

////////////////////// My code! ////////////////////////////
function plantTree() {
  if (resourceValue[resourceTypesSmallToIdx["plant"]] < worth_Plant) {
    alert ("Not enough plants!");
    return;
  }

  resourceValue[resourceTypesSmallToIdx["plant"]] -= worth_Plant;
  var logStr = "Greenery using " + worth_Plant;
  var i = terraformingTypesSmallToIdx["o2"];
  newO2Val = Math.min(terraformingMax[i], terraformingValue[i] + terraformingStep[i]);
  if (newO2Val > terraformingValue[i]) {
    terraformingValue[0] += 1;
    logStr += "; TR: " + terraformingValue[0] + " (+1) ";
    terraformingValue[i] = newO2Val;
    logStr += "; o2: " + terraformingValue[i] + " (+1) ";
  }
  log(logStr);
  refreshScreen();
}

function tempUpByHeat() {
  var HeatToTempRatio = 8;
  if (resourceValue[resourceTypesSmallToIdx["heat"]] < HeatToTempRatio) {
    alert ("Not enough heat!");
    return;
  }

  resourceValue[resourceTypesSmallToIdx["heat"]] -= HeatToTempRatio;
  var logStr = "TempUp using " + HeatToTempRatio;
  var i = terraformingTypesSmallToIdx["temp"];
  newVal = Math.min(terraformingMax[i], terraformingValue[i] + terraformingStep[i]);
  if (newVal > terraformingValue[i]) {
    terraformingValue[0] += 1;
    logStr += "; TR: " + terraformingValue[0] + " (+1) ";
    terraformingValue[i] = newVal;
    logStr += "; temp: " + terraformingValue[i] + " (+1) ";
  }
  log(logStr);
  refreshScreen();
}

function showLogs() {
  var textLog = "";
  for (var i = logdata.length - 1; i >= Math.max(0, logdata.length - 10); i--) {
    textLog += "[" + i + "]  " + logdata[i][0] + "\n";
  }
  alert(textLog);
  // snapshot();
}

function showCorp() {
  x = document.querySelectorAll('li.filterDiv');
  for (i = 0; i < x.length; i++) {
    w3RemoveClass(x[i], "show");
    if (x[i].querySelector(".number") == null) {
      w3AddClass(x[i], "show");
    }
  }
  li = document.querySelectorAll('li.show');   //obtaining the new visible list after the subfilters check
  for (var i = 0;  i < li.length; i++) { li[i].classList.add("show");}
}

function log(msg) {
  logdata.push([msg, resourceValue.slice(0), resourceProduction.slice(0), terraformingValue.slice(0)]);
}

function refreshScreen() {
  refreshStatus();
  showHand();
}

function refreshStatus() {
  resourceTypesSmall.forEach(function (type, index) {
    document.getElementById(type).innerHTML = resourceValue[index];
    document.getElementById("prod_" + type).value = resourceProduction[index];
  });

  document.getElementById("steel_worth").innerHTML = worth_Steel;
  document.getElementById("titanium_worth").innerHTML = worth_Titanium;
  document.getElementById("plant_worth").innerHTML = worth_Plant;
  
  terraformingTypesSmall.forEach(function (type, index) {
    document.getElementById("terraforming_" + type).value = terraformingValue[index];
    if (type != "tr") {
      document.getElementById("terraforming_" + type + "_slider").value = terraformingValue[index];
    }
  });

  for (var tag of Object.keys(tagsDisplayed)) {
    document.getElementById(tag + "Status").innerHTML = tagsDisplayed[tag];
    if (discountByTag[tag] > 0) {
      document.getElementById(tag + "Status").innerHTML += "(-" + discountByTag[tag] + ")";
    }
    if (rebateByTag[tag] > 0) {
      document.getElementById(tag + "Status").innerHTML += "(+" + rebateByTag[tag] + ")";
    }
  }
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
        // console.log("showing " + x[i].querySelector(".number").textContent + " by .number");
      }
    } else {
      if (cardsInHand.has(x[i].id)) {
        w3AddClass(x[i], "show");
        // console.log("showing " + x[i].id+ " by .id");
      }
    }
  }
  li = document.querySelectorAll('li.show');   //obtaining the new visible list after the subfilters check
  for (var i = 0;  i < li.length; i++) { li[i].classList.add("show");}
}

function undo() {
  if (logdata.length > 1) {  
    var resp = confirm("Do you really want to UNDO the following action?\n" + logdata[logdata.length - 1][0]);
    if (resp == false) {
      return;
    }

    var lastAction = logdata.pop();
    var stateBeforeLastAction = logdata[logdata.length - 1];
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
    // log("Updated " + id + " to " + document.getElementById(id).innerHTML);
    if (id in resourceTypesSmallToIdx) {
      log("Updated " + id + " to " + resourceValue[resourceTypesSmallToIdx[id]]);
    }
  }
}

function updateSteelWorth(changeVal) {
  newAmount = worth_Steel + parseInt(changeVal);
  if (newAmount < 0) {
    return;
  }
  worth_Steel = newAmount;
  document.getElementById("steel_worth").innerHTML = newAmount;
  log("Steel is now worth: " + newAmount);
}

function updateTitaniumWorth(changeVal) {
  newAmount = worth_Titanium + parseInt(changeVal);
  if (newAmount < 0) {
    return;
  }
  worth_Titanium = newAmount;
  document.getElementById("titanium_worth").innerHTML = newAmount;
  log("Titanium is now worth: " + newAmount);
}

function updatePlantWorth(changeVal) {
  newAmount = worth_Plant + parseInt(changeVal);
  if (newAmount < 0) {
    return;
  }
  worth_Plant = newAmount;
  document.getElementById("plant_worth").innerHTML = newAmount;
  log("A tree now costs " + newAmount + " plants. ");
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
  var resp = confirm("Do you really want to PRODUCE?");
  if (resp == false) {
    return;
  }

  resourceValue[resourceTypeToIdx["Heat"]] += resourceValue[resourceTypeToIdx["Energy"]];
  resourceValue[resourceTypeToIdx["Energy"]] = 0;

  resourceTypesSmall.forEach(function (type, index) {
    resourceValue[index] += resourceProduction[index];
  });
  resourceValue[resourceTypeToIdx["MC"]] += terraformingValue[terraformingTypesToIdx["TR"]];

  generation++;
  log("Produce");
  refreshScreen();
}


function updateProd(id) {
  resType = id.substring(5);
  resourceProduction[resourceTypesSmallToIdx[resType]] = Number(document.getElementById(id).value);
  if (logdata.length > 0 && logdata[logdata.length - 1][0].startsWith("Updated production of " + resType)) {
    logdata.pop();
  }
  log("Updated production of " + resType + " to " + Number(document.getElementById(id).value));
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
  log("Updated " + type + " to " + terraformingValue[index]);
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
  heatPayAmount = document.getElementById("payByHeatAmount").innerHTML;
  remainingCost = projCardForPromotion.cost + calcDiscount(projCardForPromotion) - steelPayAmount * worth_Steel - titaniumPayAmount * worth_Titanium - heatPayAmount * worth_Heat;
  document.getElementById("payByMCAmount").innerHTML = Math.max(0, remainingCost);
}

function buyAndSave(price) {
  if (projCardForPromotion == null) {
    alert ("Error. No card is selected for purchase.");
    return;
  } else if (cardsInHand.has(projCardForPromotion.number)) {
    alert ("This card is already in hand.");
    return;
  } else if (resourceValue[resourceTypeToIdx["MC"]] < price) {
    alert ("Not enough MC to buy this card.");
    return;
  }

  // Pay the price.
  resourceValue[resourceTypeToIdx["MC"]] -= price;
  log("Purchase: " + projCardForPromotion.title);

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
  } else if (cardsInHand.has(projCardForPromotion.number) == false
      && projCardForPromotion.number.startsWith("CORP") == false
      && projCardForPromotion.number.startsWith("P") == false
      && projCardForPromotion.number.startsWith("S") == false) {
    alert ("This card is not in hand.");
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


  var logStr = "Promote " + projCardForPromotion.title + " using ";

  // Pay for the card
  resourceValue[resourceTypeToIdx["MC"]] -= document.getElementById("payByMCAmount").innerHTML;
  logStr += document.getElementById("payByMCAmount").innerHTML + " MC, ";
  resourceValue[resourceTypeToIdx["Steel"]] -= document.getElementById("payBySteelAmount").innerHTML;
  logStr += document.getElementById("payBySteelAmount").innerHTML + " Steel, ";
  resourceValue[resourceTypeToIdx["Titanium"]] -= document.getElementById("payByTitaniumAmount").innerHTML;
  logStr += document.getElementById("payByTitaniumAmount").innerHTML + " Titanium";
  if (Number(document.getElementById("payByHeatAmount").innerHTML) > 0) {
    resourceValue[resourceTypeToIdx["Heat"]] -= document.getElementById("payByHeatAmount").innerHTML;
    logStr += ", " + document.getElementById("payByHeatAmount").innerHTML + " Heat ";
  }
  

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

  // Increment tag counts
  if (typeof projCardForPromotion.tag !== 'undefined') {
    for (var type of Object.keys(projCardForPromotion.tag)) {
      tagsPlayed[type] += projCardForPromotion.tag[type];
      if (type == "Event" || projCardForPromotion.tag["Event"] == 0) { // Tags on Event cards don't count for requirements.
        tagsDisplayed[type] += projCardForPromotion.tag[type];
      }
    }
  }

  // Rebate the cost
  var rebate = calcRebate(projCardForPromotion);
  resourceValue[resourceTypeToIdx["MC"]] += rebate;
  logStr += "; Rebate " + rebate + " MC ";
  
  log(logStr);
  cardsUsed.add(projCardForPromotion.number);
  cardsInHand.delete(projCardForPromotion.number);
  projCardForPromotion = null;
  document.getElementById("paymentFooter").style.display = "none";
  clearInput();
  refreshScreen();
}

function calcDiscount(projCard) { // Returns discount value in negative number
  var discount = 0;
  if (typeof projCard.tag !== 'undefined') {
    for (var type of Object.keys(projCard.tag)) {
      if (projCard.tag[type] > 0) {
        discount += discountByTag[type];
      }
    }
  }
  if (projCard.number.startsWith("S")) {
    discount += discountByTag["StandardProj"];
  } else {
    discount += discountByTag["AnyProjCard"];
  }
  if (discount > 0) {
    alert ("Discount amount should be negative. Please correct the error.");
  }
  return discount;
}

function calcRebate(projCard) {
  var rebate = 0;
  if (typeof projCard.tag !== 'undefined') {
    for (var type of Object.keys(projCard.tag)) {
      if (projCard.tag[type] > 0) {
        rebate += rebateByTag[type];
      }
    }
  }
  if (projCard.number.startsWith("S")) {
    rebate += rebateByTag["StandardProj"];
  } else {
    rebate += rebateByTag["AnyProjCard"];
  }

  // Special rules
  if (cardsUsed.has("CORP01") && projCard.cost >= 20) { // Credicor
    rebate += 4;
  }
  return rebate;
}

function isPlayable(number) {
  if (number in projDataIndexed) {
    projCard = projDataIndexed[number];
    if (typeof projCard.cost == 'undefined') { // Prelude cards don't have any cost.
      return true;
    }

    availableMoney = resourceValue[0];
    if (typeof projCard.tag !== 'undefined' && projCard.tag.Building > 0) {
      availableMoney += resourceValue[1] * worth_Steel;
    }
    if (typeof projCard.tag !== 'undefined' && projCard.tag.Space > 0) {
      availableMoney += resourceValue[2] * worth_Titanium;
    }
    if (cardsUsed.has("CORP03")) {
      availableMoney += resourceValue[resourceTypesSmallToIdx["heat"]] * worth_Heat;
    }
    return availableMoney >= projCard.cost + calcDiscount(projCard);
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
    // console.log(cards);
    return cards;
}

////////////////////// Display only pointed cards ///////////////////
function displayCardsOnly() {
  // console.log("cards: " + cards);
  //showing only the pointed cards
  x = document.querySelectorAll('li.filterDiv');
  for (i = 0; i < x.length; i++) {
    if (x[i].querySelector(".number") != null) {
      if (cards.includes(x[i].querySelector(".number").textContent)) {
        w3AddClass(x[i], "show");
        // console.log("showing " + x[i].querySelector(".number").textContent + "by .number");
      }
    } else {
      if (cards.includes(x[i].id)) {
        w3AddClass(x[i], "show");
        // console.log("showing " + x[i].id+ "by .id");
      }
    }
  }
}

function updateTagProperty() {
  var tag = document.getElementById("discount_resType").innerHTML;
  discountByTag[tag] = Number(document.getElementById("discount_value").value);
  rebateByTag[tag] = Number(document.getElementById("rebate_value").value);
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
  // console.log("invoked filterFunction()");
  refreshUnplayableCard();
  var input, filter, ul, li, a, i, x;

  clickedElementID = document.getElementById(id);
  if (clickedElementID != null) {clickedElementID.classList.toggle("active");}

  //If tag button was clicked, display discount info.
  if(clickedElementID != null && clickedElementID.classList.contains("tagStatus")) {
    if (clickedElementID.classList.contains("active")) {
      document.getElementById("buttonsContainer-discount").style.display = "block";
      var tagLower = id.substring(0, id.length - 3);
      var tag = tagLower.charAt(0).toUpperCase() + tagLower.substring(1);
      document.getElementById("discount_resType").innerHTML = tag;
      document.getElementById("discount_value").value = discountByTag[tag];
      document.getElementById("rebate_value").value = rebateByTag[tag];
    } else {
      document.getElementById("buttonsContainer-discount").style.display = "none";
    }
  }

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
        var discount = calcDiscount(projCard);
        if (discount != 0) {
          document.getElementById("discountAmount").innerHTML = "Discount: " + discount;
        } else {
          document.getElementById("discountAmount").innerHTML = ""
        }
        var rebate = calcRebate(projCard);
        if (rebate != 0) {
          document.getElementById("discountAmount").innerHTML += " Rebate: " + rebate;
        }

        remainingCost = Math.max(projCard.cost + discount, 0);
        // TODO: display discount and apply the discount amount.
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
        if (cardsUsed.has("CORP03")) { // Helion
          document.getElementById("payByHeat").style.display = "block"; 
          document.getElementById("payByHeatAmount").innerHTML = 0; // For Heat, default not to use.
        } else {
          document.getElementById("payByHeat").style.display = "none"; 
          document.getElementById("payByHeatAmount").innerHTML = 0;
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
