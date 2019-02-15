'use strict';

const	express = require('express'),
			axios = require('axios'),
			moment = require('moment'),
			app = express();

app.listen(3000, () => {
	console.log('Server running on port 3000!');
});

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	// res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
app.use(express.static('public'));
app.use(express.json());

// "API" endpoint
app.get('/api/weather/forecast', async (req, res, next) => {
	let forecast = {
		current: {},
		daily: []
	};

	try {
		// Get current weather
		await axios
			.get('https://api.openweathermap.org/data/2.5/weather?q=' + req.query.location + '&appid=fcadd28326c90c3262054e0e6ca599cd&units=metric')
			.then((response) => {
				forecast.current = {
					timestamp: response.data.dt,
					datetime: response.data.dt_txt,
					temperature: {
						current: Math.round(response.data.main.temp),
						min: Math.round(response.data.main.temp_min),
						max: Math.round(response.data.main.temp_max),
					},
					weather: {
						condition: response.data.weather[0].main,
						description: response.data.weather[0].description,
						icon: response.data.weather[0].icon,
					},
					wind: {
						speed: Math.round(response.data.wind.speed)
					}
				};
			})
			.catch((error) => {
				// res.send('error');
			});

		// Get forecast for the next 5 days
		await axios
			.get('https://api.openweathermap.org/data/2.5/forecast?q=' + req.query.location + '&appid=fcadd28326c90c3262054e0e6ca599cd&units=metric')
			.then((response) => {
				let	thisTimestamp = null,
						lastTimestamp = null,
						lastIndexPushed = 0;

				response.data.list.forEach((item) => {
					thisTimestamp = moment.unix(item.dt).format('DD-MM-YYYY');

					// Skip results from today
					if (thisTimestamp != moment().format('DD-MM-YYYY')) {
						// Create the index as array if it doesn't exists
						if (!forecast.daily[lastIndexPushed]) {
							forecast.daily[lastIndexPushed] = [];
						}

						// Push data to created the index
						forecast.daily[lastIndexPushed].push(item);

						// Plus 1 to index if the forecast date is different
						if (lastTimestamp && lastTimestamp != thisTimestamp) {
							lastIndexPushed++;
						}

						lastTimestamp = thisTimestamp;
					}
				});

				// Arrange daily forecast
				forecast.daily.forEach((day, index) => {
					// Find highest and lowest (temperature) forecast, so it became the "Weather condition" of the day
					let	peak = {
								lowestIndex: 0,
								highestIndex: 0
							},
							latestTempFound = null;

					day.forEach((item, index) => {
						if (item.main.temp_max > latestTempFound) {
							peak.highestIndex = index;
						}

						if (item.main.temp_min < latestTempFound) {
							peak.lowestIndex = index;
						}

						latestTempFound = item.main.temp;
					});

					// Redefine the daily array, taking the temp_min from the first hourly forecast and temp_max from the last
					// and using the "highest" forecast found before as the weather condition
					forecast.daily[index] = {
						timestamp: day[0].dt,
						datetime: day[0].dt_txt,
						temperature: {
							min: Math.round(day[peak.lowestIndex].main.temp_min),
							max: Math.round(day[peak.highestIndex].main.temp_max)
						},
						weather: {
							condition: day[peak.highestIndex].weather[0].main,
							description: day[peak.highestIndex].weather[0].description,
							icon: day[peak.highestIndex].weather[0].icon
						},
						wind: {
							speed: Math.round(day[peak.highestIndex].wind.speed)
						}
					}
				});
			})
			.catch((error) => {
				// res.send('error');
			});

		res.header('Access-Control-Allow-Origin', '*');
		res.json(forecast).end();
	}
	catch(e) {
		next(e);
	}
});
