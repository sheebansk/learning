define([
  "dojo/_base/array",
  "ecm/model/Desktop",
  "ecm/model/Item",
  "ecm/widget/dialog/ViewoneContentViewerWindow"
], function (array, Desktop, Item, ViewoneContentViewerWindow) {

  console.log("✅ Plugin: Opening viewer with multiple documents");

  var repository = Desktop.getRepository("Repo1");

  var docIds = ["{doc1}", "{doc2}", "{doc3}"];
  var classId = "Document";
  var vsId = "VS_ID_123";
  var version = "current";

  var items = array.map(docIds, function(id) {
    return new Item({
      repository: repository,
      id: id,
      vsId: vsId,
      className: classId,
      versionSeriesId: vsId,
      version: version
    });
  });

  var viewerWindow = new ViewoneContentViewerWindow();
  viewerWindow.show({
    item: items[0],     // current document
    items: items,       // full list for Prev/Next
    repository: repository
  });

});
