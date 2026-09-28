const weatherUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=48.15" +
    "&longitude=17.11" +
    "&current=temperature_2m,wind_speed_10m" +
    "&timezone=auto";

fetch(weatherUrl)
    .then(response => response.json())
    .then(data => {

        const temperature = data.current.temperature_2m;
        const wind = data.current.wind_speed_10m;

        document.getElementById("weather").innerHTML =
            "Teplota: " + temperature + " °C<br>" +
            "Vietor: " + wind + " km/h";

    })
    .catch(error => {

        document.getElementById("weather").innerHTML =
            "Nepodarilo sa načítať počasie.";

        console.error(error);

    });