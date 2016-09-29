var apiKey = 'd30bf03d06be3ec8cf699b022c48cf91';
var url = 'http://api.openweathermap.org/data/2.5/forecast/daily?appid=' +
	apiKey + '&cnt=4&units=metric';
var cities = JSON.parse(localStorage.getItem('cities')) ||
	[{name: 'Cornélio Procópio', country: 'br', id: 0}];

angular.module('starter', ['ionic', 'ngCordova'])

// Default configurations, straight from "$ ionic start weather blank"
.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		if(window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);
		}
		if(window.StatusBar) {
			StatusBar.styleDefault();
		}
	});
})

// Configuration of the tabs
.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider
	.state('tab', {
		url: "/tab",
		abstract: true,
		templateUrl: "templates/tabs.html"
	})
	.state('tab.home', {
		url: '/home',
		views: {
			'tab-home': {
				templateUrl: 'templates/tab-home.html',
				controller: 'HomeController'
			}
		}
	})
	.state('tab.cities', {
		url: '/cities',
		views: {
			'tab-cities': {
				templateUrl: 'templates/tab-cities.html',
				controller: 'CitiesController'
			}
		}
	})
	.state('tab.weather', {
		url: '/weather/:id',
		views: {
			'tab-weather': {
				templateUrl: 'templates/tab-weather.html',
				controller: 'WeatherController'
			}
		}
	});

	$urlRouterProvider.otherwise('/tab/home');
})

// Controllers
.controller('HomeController', function($scope, $state, $ionicTabsDelegate, $http) {
	$scope.dontUseGPS = function() {
		if (cities.length) {
			$state.go('tab.weather', {id: 0});
		}
		else {
			$state.go('tab.cities');
		}
	};
	$scope.useGPS = function() {
		var success = function(pos) {
			var crd = pos.coords;
			var lat = crd.latitude;
			var lon = crd.longitude;

			$http.get(url + '&lat=' + lat + '&lon=' + lon).success(function (weather) {
				cities.push({
					name: weather.city.name,
					country: weather.city.country,
					id: cities.length
				});
				localStorage.setItem('cities', JSON.stringify(cities));
				$state.go('tab.weather', {id: cities.length - 1});
			}).error(function (err) {
				$state.go('tab.cities');
			});
		};
		var error = function(err) {
			if (cities.length) {
				$state.go('tab.weather', {id: 0});
			}
			else {
				$state.go('tab.cities');
			}
		};

		navigator.geolocation.getCurrentPosition(success, error);
	};
})
.controller('CitiesController', function($scope, $ionicTabsDelegate, $state) {
	$scope.cities = cities;
	$scope.addCity = function() {
		cities.push({
			name: this.cityName,
			country: this.countryCode,
			id: cities.length
		});
		this.cityName = '';
		this.countryCode = '';
		localStorage.setItem('cities', JSON.stringify(cities));
		$scope.cities = cities;
	};
	$scope.checkWeather = function(id) {
		$state.go('tab.weather', {id: id});
	};
	$scope.deleteCity = function(id) {
		cities.splice(id, 1);
		for (var i = 0; i < cities.length; i++) {
			cities[i].id = i;
		}
		$scope.cities = cities;
		localStorage.setItem('cities', JSON.stringify(cities));
	};
})
.controller('WeatherController', function($scope, $stateParams, $http, $cordovaNetwork) {
	var city = cities[$stateParams.id];
	if (!city) {
		return;
	}

	var fillScope = function(data) {
		// Saving the data for future use in case there's no internet
		cities[$stateParams.id].data = data;
		// Updating the name e country of the city,
			// for when the last values were user-given and aren't correct.
		cities[$stateParams.id].name = data.city.name;
		cities[$stateParams.id].country = data.city.country;

		$scope.currentCityName = city.name + ' - ' + city.country;
		$scope.currentTemperature = data.list[0].temp.min;
		$scope.currentWeather = data.list[0].weather[0].main;
		$scope.currentDate = moment().format('llll');
		$scope.currentIcon = data.list[0].weather[0].icon;
		$scope.cityExists = true;
		$scope.weathers = [];
		for (var i = 0; i < 3; i++) {
			$scope.weathers.push({
				date: moment().add(i + 1, 'days').format('ll'),
				minTemperature: data.list[i + 1].temp.min,
				maxTemperature: data.list[i + 1].temp.max,
				weather: data.list[i + 1].weather[0].main,
				icon: data.list[i + 1].weather[0].icon
			});
		}
	};
	var fillScopeWithInternet = function() {
		var getURL = url + '&q=' + city.name + ',' + city.country;
		$http.get(getURL).success(function(data) {
			fillScope(data);
		}).error(function(err) {
			// TODO
		});
	};


	// Checking if I can use the cordovaNetwork API to test the connection
	if (window.Connection && navigator.connection) {
		// There is internet
		if ($cordovaNetwork.isOnline()) {
			fillScopeWithInternet();
		}
		// There is NO internet, and this city has already been searched
		else if (city.data) {
			fillScope(city.data);
		}
		// There is NO internet, and this city wasn't searched yet
		else {
			// TODO
		}
	}
	// Wishful thinking: there is internet
	else {
		fillScopeWithInternet();
	}
});