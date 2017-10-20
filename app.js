'use strict';

function populateResult(elm, result, populateInput) {
  elm.empty();
  result.forEach(function (item) {
    var li = $('<li>');
    var a = $('<a href="#">');

    a.text(item.SuburbDetails);
    a.click(function (event) {
      event.preventDefault();

      populateInput(item);
    });

    li.append(a);
    elm.append(li);
  });
}

function search(searchId, term, callback) {
  $.ajax({
      method: 'POST',
      url: 'https://www.couriersplease.com.au/CPPLHandler/CPPL_CommonServicesHandler.ashx?Type=getAllSuburbDetailsFromSuburbNameServiceUrl',
      contentType: 'application/json',
      data: JSON.stringify({
        strClientCode: "CPPLW",
        strServiceCode: "14",
        strSuburbName: term
      })
    })
    .done(function (data) {
      var result = JSON.parse(data);
      callback(searchId, result);
    })
    .fail(function () {
      console.log('error');
    });
}

function calculate(data, callback) {
  $.ajax({
      method: 'POST',
      url: 'https://www.couriersplease.com.au/DesktopModules/CPPL_CouponCalculator/CouponCalculatorHandler/CPPL_CouponCalculatorHandler.ashx',
      contentType: 'application/json',
      data: JSON.stringify(data)
    })
    .done(function (data) {
      var result = JSON.parse(data);
      callback(result);
    })
    .fail(function () {
      console.log('error');
    });
}

$(function () {
  var calculationData = {
    fromLocation: null,
    toLocation: null
  };

  $('.location-input-container input').on('keyup', function invokeSearch(event) {
    var target = event.target;
    var inputValue = target.value.trim();
    var inputElm = $(target);
    var locationType = inputElm.prop('name');
    var containerElm = inputElm.closest('.location-input-container');
    var resultElm = containerElm.children('.location-result');

    // Prepare for new search.
    clearTimeout(invokeSearch.timeout);
    containerElm.removeClass('location-input-container--valid');
    calculationData[locationType] = null;
    invokeSearch.searchId = Date.now();

    // Ignore empty input search.
    if (!inputValue) {
      resultElm.empty();
      return;
    }

    invokeSearch.timeout = setTimeout(function () {
      search(invokeSearch.searchId, inputValue, function (resultSearchId, result) {
        // Ignore result of obsolete search.
        if (resultSearchId !== invokeSearch.searchId) {
          return;
        }

        populateResult(resultElm, result, function (value) {
          target.value = value.SuburbDetails;
          resultElm.empty();
          containerElm.addClass('location-input-container--valid');
          calculationData[locationType] = value;
        });
      });
    }, 400);
  });

  $('#check-button').click(function () {
    var calculatorContainer = $('.calculator-container');
    var fromLocation = calculationData.fromLocation;
    var toLocation = calculationData.toLocation;

    if (!fromLocation || !toLocation) {
      return;
    }

    calculatorContainer.addClass('calculator-container-loading');

    calculate({
      iIsSatchel: 0,
      sDeclaredWeight: "7",
      sFromPostcode: fromLocation.PostCode,
      sFromSuburb: fromLocation.Suburb,
      sToPostcode: toLocation.PostCode,
      sToSuburb: toLocation.Suburb,
      sVolumeWeight: "1.00",
      strClientCode: "CPPLW",
      strServiceCode: "7"
    }, function (result) {
      var calculatorResult = $('.calculator-result');
      var descriptionDiv = $('<div>');
      var etaDiv = $('<div>');
      var metroDiv = $('<div>');
      var ezyLinksDiv = $('<div>');

      calculatorContainer.removeClass('calculator-container-loading');

      descriptionDiv.text('From ' + fromLocation.SuburbDetails + ' to ' + toLocation.SuburbDetails);
      etaDiv.text('ETA = ' + result.ETA);
      metroDiv.text('Metro = ' + result.Metro);
      ezyLinksDiv.text('Ezy Links = ' + result.EzyLinks);

      calculatorResult.empty();
      calculatorResult.append(descriptionDiv);
      calculatorResult.append(etaDiv);
      calculatorResult.append(metroDiv);
      calculatorResult.append(ezyLinksDiv);
    });
  });
});
