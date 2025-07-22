define([
  "dojo/aspect",
  "ecm/model/Desktop",
  "ecm/widget/layout/CommonActionsHandler"
], function(aspect, Desktop, CommonActionsHandler) {

  console.log("✅ Plugin loaded: full override for onNext/onPrevious");

  function customNext(repository, items, callback, teamspace, resultSet, parameterMap) {
    console.log("🔴 Custom onNext triggered", { repository, items, resultSet });
    // Your custom full logic here
    // For example, call callback when done or handle paging your own way
    if (callback) callback();
  }

  function customPrevious(repository, items, callback, teamspace, resultSet, parameterMap) {
    console.log("🔴 Custom onPrevious triggered", { repository, items, resultSet });
    // Your custom full logic here
    if (callback) callback();
  }

  function overrideCommonActionsHandler() {
    console.log("🔧 Overriding CommonActionsHandler.onNext and onPrevious");

    // Replace onNext
    CommonActionsHandler.prototype.onNext = function(repository, items, callback, teamspace, resultSet, parameterMap) {
      return customNext(repository, items, callback, teamspace, resultSet, parameterMap);
    };

    // Replace onPrevious
    CommonActionsHandler.prototype.onPrevious = function(repository, items, callback, teamspace, resultSet, parameterMap) {
      return customPrevious(repository, items, callback, teamspace, resultSet, parameterMap);
    };
  }

  aspect.after(Desktop, "onDesktopLoaded", function() {
    overrideCommonActionsHandler();
  });

});
