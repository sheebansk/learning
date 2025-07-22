define([
  "dojo/aspect",
  "ecm/model/Desktop",
  "ecm/model/Item",
  "ecm/widget/viewer/ContentViewer"
], function (aspect, Desktop, Item, ContentViewer) {

  var documents = {
    repositoryId: "Repo1",
    documents: ["{doc1}", "{doc2}"],
    classId: "Document",
    vsId: "VS_ID_123",
    version: "current",
    templateId: null
  };

  var currentIndex = 0;

  function openDocument(index) {
    var docId = documents.documents[index];
    var repository = Desktop.getRepository(documents.repositoryId);

    if (!docId || !repository) return;

    var item = new Item({
      repository: repository,
      id: docId,
      className: documents.classId,
      vsId: documents.vsId,
      version: documents.version,
      template: documents.templateId
    });

    var viewerPane = Desktop.getViewerContainer()?.getSelectedViewer?.();
    if (viewerPane && viewerPane.openContentItem) {
      console.log("✅ Opening document:", docId);
      viewerPane.openContentItem(item);
    } else {
      console.error("❌ Could not find viewerPane or openContentItem");
    }
  }

  function overrideNavigationButtons() {
    console.log("🔧 Overriding ContentViewer navigation methods");

    ContentViewer.prototype.onNext = function () {
      if (currentIndex < documents.documents.length - 1) {
        currentIndex++;
        openDocument(currentIndex);
      } else {
        console.log("ℹ️ Already at last document");
      }
    };

    ContentViewer.prototype.onPrevious = function () {
      if (currentIndex > 0) {
        currentIndex--;
        openDocument(currentIndex);
      } else {
        console.log("ℹ️ Already at first document");
      }
    };

    aspect.after(ContentViewer.prototype, "postCreate", function () {
      console.log("📂 Viewer created – auto opening first document");
      openDocument(currentIndex);
    });
  }

  aspect.after(Desktop, "onDesktopLoaded", function () {
    console.log("🖥️ Desktop loaded – applying ContentViewer overrides");
    overrideNavigationButtons();
  });

});
