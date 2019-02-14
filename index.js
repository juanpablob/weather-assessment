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
					// console.log('current item date: ' + moment.unix(item.dt).format('DD-MM-YYYY'));

					// Skip results from today
					if (thisTimestamp != moment().format('DD-MM-YYYY')) {
						// Make the index an array
						if (!forecast.daily[lastIndexPushed]) {
							forecast.daily[lastIndexPushed] = [];
						}

						forecast.daily[lastIndexPushed].push({
							timestamp: item.dt,
							temperature: {
								current: Math.round(item.main.temp),
								min: Math.round(item.main.temp_min),
								max: Math.round(item.main.temp_max),
							},
							weather: {
								condition: item.weather[0].main,
								description: item.weather[0].description,
								icon: item.weather[0].icon,
							},
							wind: {
								speed: item.wind.speed
							}
						});

						if (lastTimestamp && lastTimestamp != thisTimestamp) {
							lastIndexPushed++;
						}

						lastTimestamp = thisTimestamp;
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
