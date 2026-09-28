// ========================================
// 1. WEATHER API
// ========================================

const weatherUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=27.994402" +
    "&longitude=-81.760254" +
    "&current=temperature_2m,wind_speed_10m,precipitation_probability" +
    "&timezone=auto";


fetch(weatherUrl)
    .then(response => response.json())
    .then(data => {

        const temperature = data.current.temperature_2m;
        const wind = data.current.wind_speed_10m;
        const rain_probability = data.current.precipitation_probability;

        document.getElementById("weather").innerHTML =
            "Teplota: " + temperature + " °C<br>" +
            "Vietor: " + wind + " km/h<br>" +
            "Pravdepodobnosť zrážok: " + rain_probability + " %";

    })
    .catch(error => {

        document.getElementById("weather").innerHTML =
            "Nepodarilo sa načítať počasie.";

        console.error(error);

    });


// ========================================
// 2. LEAFLET MAP
// ========================================

const map = L.map("map").setView(
    [48.151965, 17.072995],
    15
);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map);


// ========================================
// 3. MARKER
// ========================================

L.marker([27.994402, -81.760254])
    .addTo(map)
    .bindPopup("Florida, USA")
    .openPopup();

L.marker([48.151965, 17.072995])
    .addTo(map)
    .bindPopup("FEI STU");

L.marker([48.1486, 17.1077])
    .addTo(map)
    .bindPopup("Bratislava");