'use strict';

const	express = require('express'),
			got = require('got'),
			app = express();

app.listen(3000, () => {
	console.log('Server running on port 3000!');
});

app.use(express.json());
app.use(express.static('public'));

app.get('/api/weather/forecast', (req, res) => {
	let forecast = [];

	got('https://api.openweathermap.org/data/2.5/forecast?q=' + req.query.location + '&appid=fcadd28326c90c3262054e0e6ca599cd&units=metric', { json: true })
	.then(response => {
		response.body.list.forEach(item => {
			forecast.push({
				timestamp: item.dt,
				weather: {
					condition: item.weather[0].main,
					description: item.weather[0].description,
					icon: item.weather[0].icon,
				},
				temperature: {
					current: Math.round(item.main.temp),
					min: Math.round(item.main.temp_min),
					max: Math.round(item.main.temp_max)
				},
				wind: {
					speed: item.wind.speed
				}
			});
		});

		res.json(forecast).end();
	})
	.catch(error => {
		res.send('error').end();
	});
});
