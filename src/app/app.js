angular.module('angularJingle', [
	/** States/Routes **/

	/** External Libs **/
    'ngAnimate'

	/** Internal Services **/

	/** Internal Directives **/
])

.config(function ($urlRouterProvider) {

	/**
	 * Normalize URLs and add a trailing slash, if it's missing
	 */
	$urlRouterProvider.rule(function ($injector, $location) {
		var path = $location.path(), normalized = path.toLowerCase();

		if (path != normalized) {
			path = normalized;
		}

		if (path[path.length - 1] !== '/') {
			path = path + "/";
		}

		return path;
	});

	/**
	 * If no other routes match, simply redirect to the front page
	 * (or change this to any other page, like a 404).
	 */
	$urlRouterProvider.otherwise('/');
})

.run(function ($http) {
	// Enable credientials (ie. cookies etc.) through the $http Angular Service
	$http.defaults.withCredentials = true;
})

.controller('mainCtrl', function ($scope) {

})

;