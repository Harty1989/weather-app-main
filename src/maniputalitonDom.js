"use strict";
//select DOM elements

//search elements
const searchBtns = document.querySelectorAll(".searchBtn");
const cityInput = document.getElementById("cityInput");

//select elements picture area
const cityCountyNameDisplay = document.getElementById("city-country-name");
const curentDateDisplay = document.getElementById("curent-date");
const weatherIconDisplay = document.getElementById("weather-icon");
const curentTemperatureDisplay = document.getElementById("curent-temperature");

//select elements under picture area
const feelslikeTemperatureDisplay = document.getElementById(
  "feelslike-temperature"
);
const humidityDisplay = document.getElementById("humidity");
const windSpeedDisplay = document.getElementById("wind-speed");
const precipitationDisplay = document.getElementById("precipitation");

//select elements daily forecast area
const dailyFields = document.querySelectorAll(".daily-fields");

//select elements hourly forecast area
const hourlyFields = document.querySelectorAll(".hours-fields");
// dropdownDayMenuBtn already selected in script.js
const dropdownButtons = document.querySelectorAll(
  "#dropdown-day-menu button.option-row"
);
const daySetDisplay = document.getElementById("daySet");

let cityInfo;
let dayIndex = 0;

//listen for search button clicks
searchBtns.forEach((btn) => {
  btn.addEventListener("click", getCity);
});

//enter key event listener
cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getCity();
  }
});

//get city data and weather data
function getCity() {
  const city = cityInput.value.trim();
  if (!city) return alert("Please enter a city name.");
  getCityData(city)
    .then((result) => {
      cityInfo = result;
      fetchWeather(result.latitude, result.longitude)
        .then((data) => {
          let weatherInfo = data;
          // console.log(weatherInfo); //          -----> always need to check data in console

          (async () => {
            await displayHourlyForecast(result.latitude, result.longitude, 0); // 0 = today
          })();

          getCityDataArr(weatherInfo.dailyForecast);
          displayDataPictureArea(
            cityInfo.city,
            cityInfo.country,
            weatherInfo.currentCondition.icon,
            data.currentTemperatureCelsius
          );
          displayDataUnderPictureArea(
            weatherInfo.feelsLikeCelsius,
            weatherInfo.humidity,
            weatherInfo.windSpeed,
            weatherInfo.precipitation
          );
        })
        .catch(console.error);
    })
    .catch((err) => console.error(err));
}

//display data in DOM picture area DATE maybe change later - now is current date
function displayDataPictureArea(
  cityName,
  country,
  // date,
  weatherIcon,
  curentTemperature
) {
  cityCountyNameDisplay.textContent = `${capitalizeWords(
    cityName
  )}, ${capitalizeWords(country)}`;

  //icon setting
  weatherIconDisplay.src = weatherIcon;

  curentDateDisplay.textContent = formatFullDate();
  //set weather icon source based on weather condition
  curentTemperatureDisplay.textContent = `${curentTemperature}º`;
}

//display data in DOM under pictyure area
function displayDataUnderPictureArea(feelslike, humidity, wind, precipitation) {
  feelslikeTemperatureDisplay.textContent = `${feelslike}º`;
  humidityDisplay.textContent = `${humidity}%`;
  windSpeedDisplay.textContent = `${wind} mph`;
  precipitationDisplay.textContent = `${precipitation} in`;
}

//function to get daily data and display in DOM
function getCityDataArr(arr) {
  arr.forEach((dayData, index) => {
    if (dailyFields[index]) {
      dailyFields[index].innerHTML = `
        <h3>${getDayName(dayData.date)}</h3>
        <img src="${dayData.condition.icon}" alt="icon-rain">
        <div>
          <h4>${dayData.lowC}º</h4>
          <h4>${dayData.highC}º</h4>
        </div>
      `;
    }
  });
}
let selectedDay = getNext7DayNames()[0]; // Default to first day

const spans = document.querySelectorAll("#dropdown-day-menu span:first-child");

spans.forEach((span, index) => {
  const days = getNext7DayNames();
  daySet.textContent = days[0]; // Set initial day
  span.textContent = days[index];
});

async function displayHourlyForecast(lat, lon, dayIndex) {
  try {
    const resultData = await fetchHourly7Days(lat, lon);

    // Safety check
    if (!resultData || !resultData[dayIndex]) {
      console.warn("No data for this day index:", dayIndex);
      return;
    }

    const dayData = resultData[dayIndex]; // one day
    const hours = dayData.hours;

    // Loop through available hours (limit to number of .hourlyFields)
    for (let i = 0; i < Math.min(hourlyFields.length, hours.length); i++) {
      hourlyFields[i].innerHTML = `
        <div>
          <img src="${hours[i].icon}" alt="icon-weather" />
          <h3>${hours[i].time}</h3>
        </div>
        <h4>${Math.round(hours[i].temperatureC)}º</h4>
      `;
    }
  } catch (error) {
    console.error("Error displaying hourly forecast:", error);
  }
}

const city = cityInput.value.trim();

// First, get the city data and then set up your event listeners
getCityData(city)
  .then((result) => {
    const lat = result.latitude;
    const lon = result.longitude;

    // Set up your dropdown event listeners using those coordinates
    document.querySelectorAll(".option-row").forEach((btn, index) => {
      btn.addEventListener("click", async () => {
        await displayHourlyForecast(lat, lon, index - 6);
      });
    });

    // Optionally fetch general weather right away
    return fetchWeather(lat, lon);
  })
  .then((data) => console.log("Fetched weather:", data))
  .catch((err) => console.error("Error:", err));

// store current selections
const selectedOptions = {
  temp: "C",
  speed: "kmh",
  precip: "mm",
};

// set up event listeners for all option buttons
document.querySelectorAll(".option-row").forEach((btn) => {
  btn.addEventListener("click", () => {
    const group = btn.dataset.group; // temp, speed, precip
    const value = btn.dataset.value; // C, F, kmh, mph, etc.

    // hide checkmarks for all buttons in this group
    document
      .querySelectorAll(`.option-row[data-group="${group}"] .check`)
      .forEach((check) => check.classList.add("hidden"));

    // show checkmark for the clicked button
    btn.querySelector(".check").classList.remove("hidden");

    // update selected option
    selectedOptions[group] = value;

    if (selectedOptions.speed === "kmh") {
      if (windSpeedDisplay.textContent.slice(-4) != "km/h") {
        const wind = Math.round(
          Number(windSpeedDisplay.textContent.slice(0, -4).trim()) * 1.609344
        );
        windSpeedDisplay.textContent = `${wind} km/h`;
      }
    }

    if (selectedOptions.speed === "mph") {
      if (windSpeedDisplay.textContent.slice(-3) != "mph") {
        const wind = Math.round(
          Number(windSpeedDisplay.textContent.slice(0, -4).trim()) / 1.609344
        );
        windSpeedDisplay.textContent = `${wind} mph`;
      }
    }

    if (selectedOptions.precip === "in") {
      if (precipitationDisplay.textContent.trim().endsWith("in")) {
        //  return;
      }
      const prep = Math.round(
        Number(precipitationDisplay.textContent.slice(0, -3))
      );
      if (prep == 0) {
        precipitationDisplay.textContent = `0 in`;
      } else {
        precipitationDisplay.textContent = `${Math.round(prep / 25.4)} in`;
      }
    }
    if (selectedOptions.precip === "mm") {
      if (precipitationDisplay.textContent.trim().endsWith("mm")) {
        // return;
      }
      const prep = Math.round(
        Number(precipitationDisplay.textContent.slice(0, -3)) * 25.4
      );
      precipitationDisplay.textContent = `${prep} mm`;
    }

    if (selectedOptions.temp == "F") {
      if (curentTemperatureDisplay.textContent.slice(-1) == "F") return;
      convertCelsiuestoFahrenheit(curentTemperatureDisplay);
      convertCelsiuestoFahrenheit(feelslikeTemperatureDisplay);

      dailyFields.forEach((field) => {
        const hfours = field.querySelectorAll("h4");
        hfours.forEach((four) => {
          convertCelsiuestoFahrenheit(four);
        });
      });

      hourlyFields.forEach((hour) => {
        convertCelsiuestoFahrenheit(hour.querySelector("h4"));
      });
    }

    if (selectedOptions.temp == "C") {
      if (curentTemperatureDisplay.textContent.slice(-1) == "º") return;
      convertFahrenheirtoCelsius(curentTemperatureDisplay);
      convertFahrenheirtoCelsius(feelslikeTemperatureDisplay);
      dailyFields.forEach((field) => {
        const hfours = field.querySelectorAll("h4");
        hfours.forEach((four) => {
          convertFahrenheirtoCelsius(four);
        });
      });

      hourlyFields.forEach((hour) => {
        convertFahrenheirtoCelsius(hour.querySelector("h4"));
      });
    }
  });
});


