define([
  "dojo/_base/array",
  "ecm/model/Desktop",
  "ecm/model/Item",
  "ecm/widget/viewer/ContentViewerPane"
], function (array, Desktop, Item, ContentViewerPane) {

  console.log("📄 Plugin: Opening document in ContentViewerPane");

  var repository = Desktop.getRepository("Repo1"); // Replace with actual repo ID

  var documents = ["{doc1}", "{doc2}", "{doc3}"];
  var classId = "Document";
  var vsId = "VS_ID_123";
  var version = "current";

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

  var viewerTab = Desktop.mainContainer?.getSelectedTab?.();
  if (!viewerTab || typeof viewerTab.openContentItem !== "function") {
    console.error("❌ Cannot access viewer tab or openContentItem");
    return;
  }

  console.log("📂 Opening first document in existing viewer tab");

  viewerTab.openContentItem(currentItem, {
    items: items, // full list for navigation
    repository: repository
  });

});
