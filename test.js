define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/aspect",
  "ecm/model/Desktop",
  "ecm/widget/layout/CommonActionsHandler"
], function(declare, lang, aspect, Desktop, CommonActionsHandler) {

  function customNextHandler(context) {
    console.log("CustomEventPlugin - Custom NEXT action triggered", context);
    // ➕ Insert your custom logic here
  }

  function customPreviousHandler(context) {
    console.log("CustomEventPlugin - Custom PREVIOUS action triggered", context);
    // ➕ Insert your custom logic here
  }

  function registerToolbarOverrides() {
    console.log("CustomEventPlugin - Registering toolbar overrides for CommonActionsHandler");

    // Override the Next button
    aspect.around(CommonActionsHandler.prototype, "onNext", function(originalMethod) {
      return function(repository, items, callback, teamspace, resultSet, parameterMap) {
        customNextHandler({ repository, items, resultSet });
        return originalMethod.apply(this, arguments); // Preserve default behavior
      };
    });

    // Override the Previous button
    aspect.around(CommonActionsHandler.prototype, "onPrevious", function(originalMethod) {
      return function(repository, items, callback, teamspace, resultSet, parameterMap) {
        customPreviousHandler({ repository, items, resultSet });
        return originalMethod.apply(this, arguments);
      };
    });
  }

  // Wait until the desktop is loaded before patching
  aspect.after(Desktop, "onDesktopLoaded", function() {
    console.log("CustomEventPlugin: Desktop loaded");
    registerToolbarOverrides();
  });

});
