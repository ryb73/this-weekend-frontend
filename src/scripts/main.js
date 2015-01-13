"use strict";

var thisWeekend = angular.module("thisWeekend", [ "ngRoute", "ngResource" ])

  .config([
    "$routeProvider",
    function($routeProvider) {
      $routeProvider.when("/", {
        templateUrl: "views/upcoming.html",
        controller: "UpcomingController"
      })
      .otherwise({
        redirectTo: "/"
      });
    }
  ])

  .controller("UpcomingController", [
    "$scope", "$resource",
    function($scope, $resource) {
      $scope.loading = true;

      var result = $resource("http://localhost:8082/api/happenings?daysForward=7").query(
        function success() {
          $scope.loading = false;
          result.forEach(function(happening) {
            happening.showtime = new Date(happening.showtime);
          });
          $scope.happenings = result;
        },
        function failure(err) {
          $scope.loading = false;
          $scope.error = err;
        });
    }
  ]);