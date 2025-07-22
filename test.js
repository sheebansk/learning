define([
  "dojo/aspect",
  "ecm/model/Desktop",
  "ecm/model/Item",
  "ecm/widget/viewer/ContentViewer"
], function(aspect, Desktop, Item, ContentViewer) {

  console.log("✅ Custom viewer navigation plugin loaded");

  var documents = {
    repositoryId: "name1",
    documents: ["{1}", "{2}"],
    classId: "class",
    vsId: "vs",
    version: "version"
  };

  var currentIndex = 0;

  function openDocumentAt(index, viewerInstance) {
    const docId = documents.documents[index];
    const repository = Desktop.getRepository(documents.repositoryId);

    if (!docId || !repository) {
      console.warn("⚠️ Invalid document ID or repository");
      return;
    }

    console.log("📄 Opening document at index", index, docId);

    const doc = new Item({
      repository: repository,
      id: docId,
      vsId: documents.vsId,
      className: documents.classId,
      versionSeriesId: documents.vsId,
      version: documents.version
    });

    viewerInstance.openContentItem(doc);
    updateNavigationButtons(viewerInstance);
  }

  function updateNavigationButtons(viewerInstance) {
    if (!viewerInstance || !viewerInstance._toolbar) return;

    const prevBtn = viewerInstance._toolbar.lookup("Previous");
    const nextBtn = viewerInstance._toolbar.lookup("Next");

    if (prevBtn) prevBtn.set("disabled", currentIndex === 0);
    if (nextBtn) nextBtn.set("disabled", currentIndex >= documents.documents.length - 1);

    console.log(`🔘 Updated buttons - Previous: ${currentIndex === 0 ? "Disabled" : "Enabled"}, Next: ${currentIndex >= documents.documents.length - 1 ? "Disabled" : "Enabled"}`);
  }

  function overrideContentViewerNavigation() {
    console.log("🔧 Overriding ContentViewer.onNext and onPrevious with full navigation and button logic");

    ContentViewer.prototype.onNext = function() {
      if (currentIndex < documents.documents.length - 1) {
        currentIndex++;
        openDocumentAt(currentIndex, this);
      } else {
        console.log("ℹ️ Already at last document");
        updateNavigationButtons(this);
      }
    };

    ContentViewer.prototype.onPrevious = function() {
      if (currentIndex > 0) {
        currentIndex--;
        openDocumentAt(currentIndex, this);
      } else {
        console.log("ℹ️ Already at first document");
        updateNavigationButtons(this);
      }
    };

    // OPTIONAL: Auto-load the first document on viewer creation
    aspect.after(ContentViewer.prototype, "postCreate", function() {
      console.log("📂 Viewer created - opening first document");
      currentIndex = 0;
      openDocumentAt(currentIndex, this);
    });
  }

  aspect.after(Desktop, "onDesktopLoaded", function() {
    console.log("🖥️ Desktop loaded - applying custom viewer navigation");
    overrideContentViewerNavigation();
  });

});
