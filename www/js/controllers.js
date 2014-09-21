angular
  .module('rcs')
  .controller('pageCtrl', ['$scope', '$state', 'rcsSession', pageCtrl])
  .controller('signInCtrl', ['$scope', '$state', 'rcsSession', signInCtrl])
  .controller('restaurantCtrl', ['$scope', '$state', 'rcsHttp', 'rcsSession', restaurantCtrl])
  .controller('tableCtrl', ['$scope', '$state', '$materialDialog', 'rcsHttp', 'rcsSession', tableCtrl])
  .controller('aboutCtrl', ['$scope', '$state', 'rcsSession', 'TABLE_STATUS', aboutCtrl]);

function pageCtrl ($scope, $state, rcsSession) {
  // scope fields
  // scope methods
  $scope.clickRestaurant = clickRestaurant;
  $scope.clickUser = clickUser;
  $scope.getCurrentRestaurant = getCurrentRestaurant;
  $scope.getCurrentUser = getCurrentUser;

  // locals
  // initialize
  // defines
  function clickRestaurant () {
    return $state.go('page.manage.restaurant', {location: 'replace'});
  }

  function clickUser () {
    return $state.go('page.manage.signin', {location: 'replace'});
  }

  function getCurrentRestaurant () {
    var restaurant = rcsSession.getSelectedRestaurant();
    return restaurant ? restaurant.RestaurantName : null;
  }

  function getCurrentUser () {
    var user = rcsSession.getSignedInUser();
    return user ? user.Name : null;
  }
}

function signInCtrl ($scope, $state, rcsSession) {
  // scope fields
  $scope.signIn = {
    email: '',
    password: ''
  };

  // scope methods
  $scope.clickGoToRestaurants = clickGoToRestaurants;
  $scope.clickSignIn = clickSignIn;
  $scope.clickSignOut = clickSignOut;
  $scope.getSignedInUser = getSignedInUser;
  $scope.ifSignedIn = ifSignedIn;

  // initialize
  rcsSession.unselectRestaurant();

  // defines
  function clickSignIn () {
    rcsSession.signIn(
      $scope.signIn.email,
      $scope.signIn.password,
      clickGoToRestaurants,
      function () {
        alert('login failed');
      });
  }

  function clickGoToRestaurants () {
    $state.go('page.manage.restaurant', {location: 'replace'});
  }

  function clickSignOut () {
    rcsSession.signOut();
  }

  function getSignedInUser () {
    return rcsSession.getSignedInUser();
  }

  function ifSignedIn () {
    return rcsSession.getSignedInUser() != null;
  }
}

function restaurantCtrl ($scope, $state, rcsHttp, rcsSession) {
  // scope fields
  $scope.restaurants = null;
  $scope.selectedIndex = 0;

  // scope methods
  $scope.clickGoTo = clickGoTo;
  $scope.clickRestaurant = clickRestaurant;
  $scope.ifDisableCickGoto = ifDisableCickGoto;

  // locals
  // initialize
  if (!rcsSession.getSignedInUser()) {
    return $state.go('page.manage.signin', {location: 'replace'});
  }

  rcsSession.unselectRestaurant(initializeRestaurants);

  // defines
  function initializeRestaurants () {
    return rcsHttp.Restaurant.list()
      .success(function (res) {
        $scope.restaurants = res.Restaurants;
      });
  }

  function clickGoTo () {
    if ($scope.ifDisableCickGoto()) return;

    rcsSession.selectRestaurant($scope.restaurants[$scope.selectedIndex],
      function success () {
        $state.go('page.manage.table', {location: 'replace'});
      });
  }

  function clickRestaurant (index) {
    $scope.selectedIndex = index;
  }

  function ifDisableCickGoto () {
    return $scope.selectedIndex == -1;
  }
}

function tableCtrl ($scope, $state, $materialDialog, rcsHttp, rcsSession) {
  // scope fields
  $scope.tables = null;
  $scope.selectedIndex = -1;
  $scope.deviceId = 'A91283HA129'

  // scope methods
  $scope.clickLink = clickLink;
  $scope.clickTable = clickTable;
  $scope.getLinkingTable = getLinkingTable;
  $scope.ifDisableCickLink = ifDisableCickLink;

  // locals
  // initialize
  if (!rcsSession.getSelectedRestaurant()) {
    return $state.go('page.manage.restaurant', {location: 'replace'});
  }

  var restaurantId = rcsSession.getSelectedRestaurant().id;

  initializeTables();

  // defines
  function initializeTables () {
    return rcsHttp.Table.list(restaurantId)
      .success(function (res) {
        $scope.tables = res.Tables
      });
  }

  function clickLink (event) {
    if ($scope.ifDisableCickLink()) return;

    var table = $scope.tables[$scope.selectedIndex];
    rcsHttp.Table.link(restaurantId, table.id, $scope.deviceId)
      .success(function success (res) {

        // TODO: add local storage

        var dialogEditMenuItemType = {
          templateUrl: 'template/dialog-linkSuccess.html',
          clickOutsideToClose: false,
          escapeToClose: false,
          targetEvent: event,
          controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
            $scope.table = table;
            $scope.clickSignout = clickSignout;

            function clickSignout () {
              rcsSession.signOut(function () {
                // start to use
                $state.go('page.use.about')
                $hideDialog();
              });
            }
          }]
        }

        $materialDialog(dialogEditMenuItemType);
      })
      .error(function error (res) {
        // TODO: show link error
      });
  }

  function clickTable (index) {
    $scope.selectedIndex = index;
  }

  function getLinkingTable () {
    if ($scope.ifDisableCickLink()) return null;

    return $scope.tables[$scope.selectedIndex];
  }

  function ifDisableCickLink () {
    return $scope.selectedIndex == -1;
  }
}

function aboutCtrl ($scope, $state, rcsSession, TABLE_STATUS) {
  // scope fields
  // scope methods
  // locals
  // initialize
  clickStartToUse();

  // defines
  function clickStartToUse () {
    if (rcsSession.getMode() == 'manage') {
      return $state.go('page.manage.signin', {location: 'replace'});
    }

    switch(rcsSession.getTableStatus()) {
      case TABLE_STATUS.ordering:
        return $state.go('page.use.menu', {location: 'replace'});
      case TABLE_STATUS.ordered:
        return $state.go('page.use.eating', {location: 'replace'});
      case TABLE_STATUS.paying:
        return $state.go('page.use.payment', {location: 'replace'});
    }
  }
}
