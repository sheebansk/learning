define([
  "dojo/_base/array",
  "dojo/_base/lang",
  "ecm/model/Desktop",
  "ecm/model/Item"
], function (array, lang, Desktop, Item) {

  console.log("📦 Custom plugin loaded for viewer.jsp navigation");

  var documents = ["{doc1}", "{doc2}", "{doc3}"];
  var classId = "Document";
  var repositoryId = "Repo1";
  var vsId = "VS_ID_123";
  var version = "current";

  var repository = Desktop.getRepository(repositoryId);

  var items = array.map(documents, function (id) {
    return new Item({
      repository: repository,
      id: id,
      vsId: vsId,
      className: classId,
      versionSeriesId: vsId,
      version: version
    });
  });

  var currentItem = items[0];

  function getViewerTab() {
    if (Desktop.mainContainer?.getSelectedTab) {
      return Desktop.mainContainer.getSelectedTab();
    }
    if (Desktop.mainContentArea?.getSelectedTab) {
      return Desktop.mainContentArea.getSelectedTab();
    }
    return null;
  }

  function tryOpenViewerDocument(retries) {
    var viewerTab = getViewerTab();

    if (viewerTab && typeof viewerTab.openContentItem === "function") {
      console.log("✅ Viewer tab ready. Opening first document.");

      viewerTab.openContentItem(currentItem, {
        items: items,
        repository: repository
      });
    } else if (retries > 0) {
      console.log("⏳ Waiting for viewer tab...");
      setTimeout(function () {
        tryOpenViewerDocument(retries - 1);
      }, 500);
    } else {
      console.error("❌ Viewer tab not available after retries.");
    }
  }

  // Wait until Desktop is ready, then attempt viewer tab access
  Desktop.onDesktopLoaded = function () {
    console.log("🖥️ Desktop loaded - trying to open viewer");
    tryOpenViewerDocument(10); // Retry 10 times
  };

});
