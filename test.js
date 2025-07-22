define([
  "dojo/aspect",
  "ecm/model/Desktop",
  "ecm/widget/viewer/ContentViewer"
], function(aspect, Desktop, ContentViewer) {

  console.log("✅ CustomViewerPlugin.js loaded");

  function customViewerOnNext() {
    console.log("🔴 Custom ContentViewer: onNext triggered");
    // ➕ Insert your full custom logic here
  }

  function customViewerOnPrevious() {
    console.log("🔴 Custom ContentViewer: onPrevious triggered");
    // ➕ Insert your full custom logic here
  }

  function overrideContentViewerOnNextPrevious() {
    console.log("🔧 Overriding ContentViewer.onNext and onPrevious");

    ContentViewer.prototype.onNext = function() {
      customViewerOnNext();
      // 🔕 Don't call original method if full override
    };

    ContentViewer.prototype.onPrevious = function() {
      customViewerOnPrevious();
    };
  }

  // Run this once the ICN Desktop is fully initialized
  aspect.after(Desktop, "onDesktopLoaded", function() {
    console.log("🖥️ Desktop fully loaded – applying ContentViewer onNext/onPrevious override");
    overrideContentViewerOnNextPrevious();
  });

});
