/* APIs needed 
(refer to https://github.com/cheeaun/arrivelah & https://observablehq.com/@cheeaun/list-of-bus-stops-in-singapore)

1. Allow users to select the bus stop no (data source = https://data.busrouter.sg/v1/stops.min.json)
2. Users can click the estimate button to get the bus no and arrival time (data source:https://arrivelah2.busrouter.sg/?id= )
//These APIs ensure that our users have access to the latest and most accurate data

Steps
1. When the page is loaded, users can see the dropdown list with bus stop id followed by bus stop name (47571 - Blk 618, Woodlands Ave 5) by calling the first api when the page is loading)
  - success response- have bus stop 
  - failuer response-No bus stop - error & disable estimate button 

2. Users can select the bus stop then click estimate button, fetch the second api
  - success response - load the data into a table and display the table
  - failuer response - show erorr message, do not display the table */

const select_box = document.getElementById("select_box");
const searchForm = document.getElementById("searchForm");
const arrivalTimesTable = document.getElementById("arrivalTimesTable");
  
/* Load bus stop id when the page is loaded. All bus stop Ids will be pushed to select dropdown */
async function loadBusStops() {
  const response = await fetch("https://data.busrouter.sg/v1/stops.min.json");
  // success response
  if (response.ok) {
    const busStopInfo = await response.json();

    // extract the dynamic keys from the object and store it in array  , seacrh keywors: get all the keys in Js : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
    // busStopInfo {
    //   "key1" : [longitude, latitude, FirstName, LastName],
    //   "key2" : [longitude, latitude, FirstName, LastName]
    // }
    const busStopIds = Object.keys(busStopInfo); // Expected output: busStopInfo ["key1", "key2", "key3"]

    for (const busStopId of busStopIds) {
      const busStopFirstName = busStopInfo[busStopId][2];
      const busStopLastName = busStopInfo[busStopId][3];
      const displayName =
        busStopId + " - " + busStopFirstName + ", " + busStopLastName;

      //add the displayName into the select dropdown list (https://www.javascripttutorial.net/javascript-dom/javascript-add-remove-options/#:~:text=JavaScript%20uses%20the%20HTMLSelectElement%20type,from%20the%20element.)
      const newOption = new Option(displayName, busStopId);
      newOption.setAttribute("data-tokens", busStopId);
      select_box.add(newOption, undefined);
    }
    $('.selectpicker').selectpicker('refresh'); //Bootstrap select custom dynamic options (https://stackoverflow.com/questions/40332211/bootstrap-select-custom-dynamic-options)
  }
  else {
    throw new Error("Error fetching bus arrival data.");
  }
}

loadBusStops();

// To get the busStopId selected by the user and load the bus Arrival time table
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const busStopId = select_box.value;
  loadBusArrivalTimes(busStopId);
});

// function to fetch the bus no and arrival time
async function loadBusArrivalTimes(busStopId) {
  clearTableContents(); //as users might click the estimate button to refresh the data. To prevent new table data append to previous one

  const response = await fetch(
    `https://arrivelah2.busrouter.sg/?id=${busStopId}`
  );

  if (response.ok) {
    const data = await response.json();
    const services = data.services;
    // data = {services: [
    //   {{no}, {operator}, {next}, {subsequent}, {next2}, {next3}}, {{no}, {operator}, {next}, {subsequent}, {next2}, {next3}}
    // ]}
    const overallArrivalTimesForAllBuses = getOverallArrivalTimesForAllBuses(services);

    createTableContents(overallArrivalTimesForAllBuses);

    document.getElementById("tableContent").style.display ="block" //change the display type from none to block level element to show the table
  }
  else {
    throw new Error("Error fetching bus arrival times.");
  }
}

function clearTableContents(){
  let trElements = document.querySelectorAll(".dynamicRow");
  trElements.forEach(function (tr) {
    tr.innerHTML = "";
  });
}

function getOverallArrivalTimesForAllBuses(services){
  let outputs = [];

  for (const service of services) {
    console.log(service);

    const no = service.no;
    const next = service.next;
    const next2 = service.next2;
    const next3 = service.next3;

    let nextArrivalTimes = [];

    //push to nextArrivalTimes array if next not empty. Exclude those arrived buses and convert ms to min
    if (next != null && next.duration_ms > 0) {
      nextArrivalTimes.push(Math.round(next.duration_ms / 60000));
    }

    if (next2 != null && next2.duration_ms > 0) {
      nextArrivalTimes.push(Math.round(next2.duration_ms / 60000));
    }
    if (next3 != null && next3.duration_ms > 0) {
      nextArrivalTimes.push(Math.round(next3.duration_ms / 60000));
    }
    

    const firstBus = nextArrivalTimes.length > 0 ? nextArrivalTimes[0] : "Not available";
    const secondBus = nextArrivalTimes.length > 1 ? nextArrivalTimes[1]: "Not available";
    const thirdBus = nextArrivalTimes.length > 2 ? nextArrivalTimes[2]: "Not available";


    outputs.push({
      bus: no,
      arrivalTime: firstBus,
      arrivalTime2: secondBus,
      arrivalTime3: thirdBus,
    });
  }

  //sort custom object array ascendingly
  /*overallArrivalTimesForAllBuses=[
   {bus: no, arrivaltime: firstBus, arrivaltime2: secondBus}, {bus: no, arrivaltime: firstBus, arrivaltime2: secondBus},{bus: no, arrivaltime: firstBus, arrivaltime2: secondBus},
   ]
  */
  outputs.sort(function (a, b) {
    return (a.arrivalTime) - (b.arrivalTime);
  });
  console.table(outputs)
  return outputs;
}

function createTableContents(overallArrivalTimesForAllBuses) {
  for (let i = 0; i < overallArrivalTimesForAllBuses.length; i++) {
    let row = arrivalTimesTable.insertRow(i + 1);
    row.classList.add("dynamicRow");

    let busColumn = row.insertCell(0);
    let arrivalTimeColumn = row.insertCell(1);
    let subsequentColumn = row.insertCell(2);

    busColumn.innerHTML = overallArrivalTimesForAllBuses[i].bus;

    //Next bus -> arrrivalTime 
    if (overallArrivalTimesForAllBuses[i].arrivalTime <=1){
      arrivalTimeColumn.innerHTML = "<span style='color: green;'>Arriving</span>";
    } else {
      arrivalTimeColumn.innerHTML = overallArrivalTimesForAllBuses[i].arrivalTime + " mins";
    }
    
    //Subsequent bus --> arrivalTime2
    if (overallArrivalTimesForAllBuses[i].arrivalTime2 <=1){
      subsequentColumn.innerHTML = "<span style='color: green;'>Arriving</span>";
    } else {
      subsequentColumn.innerHTML = overallArrivalTimesForAllBuses[i].arrivalTime2 + " mins";
    }

    if (arrivalTimeColumn.innerHTML == "Not available mins") {
      arrivalTimeColumn.innerHTML = "Not available";
    }
    if (subsequentColumn.innerHTML == "Not available mins") {
      subsequentColumn.innerHTML = "Not available";
    }

  }
} 
