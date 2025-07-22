define([
  "dojo/aspect",
  "ecm/model/Desktop",
  "ecm/model/Item",
  "ecm/widget/viewer/ContentViewer"
], function (aspect, Desktop, Item, ContentViewer) {

  console.log("✅ Custom viewer navigation plugin loaded");

  // 👉 Your static document list with metadata
  var documents = {
    repositoryId: "name1",
    documents: ["{1}", "{2}"], // First doc: index 0
    classId: "class",
    vsId: "vs",
    version: "current",
    templateId: "CustomTemplate" // Optional
  };

  var currentIndex = 0;
  var viewerInitialized = false;

  function openDocumentAt(index, viewerInstance) {
    if (!documents.documents || documents.documents.length === 0) {
      console.warn("⚠️ No documents provided");
      return;
    }

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
      version: documents.version,
      template: documents.templateId || null
    });

    if (viewerInstance.setItem && typeof viewerInstance.setItem === "function") {
      viewerInstance.setItem(doc);
    } else {
      console.error("❌ viewerInstance.setItem is not available or not a function");
    }

    updateNavigationButtons(viewerInstance);
  }

  function updateNavigationButtons(viewerInstance) {
    if (!viewerInstance || !viewerInstance._toolbar) return;

    const prevBtn = viewerInstance._toolbar.lookup("Previous");
    const nextBtn = viewerInstance._toolbar.lookup("Next");

    if (prevBtn) prevBtn.set("disabled", currentIndex === 0);
    if (nextBtn) nextBtn.set("disabled", currentIndex >= documents.documents.length - 1);

    console.log(
      `🔘 Updated buttons - Previous: ${currentIndex === 0 ? "Disabled" : "Enabled"}, Next: ${
        currentIndex >= documents.documents.length - 1 ? "Disabled" : "Enabled"
      }`
    );
  }

  function overrideContentViewerNavigation() {
    console.log("🔧 Overriding ContentViewer.onNext and onPrevious");

    // Override the viewer's navigation
    ContentViewer.prototype.onNext = function () {
      if (currentIndex < documents.documents.length - 1) {
        currentIndex++;
        openDocumentAt(currentIndex, this);
      } else {
        console.log("ℹ️ Already at last document");
        updateNavigationButtons(this);
      }
    };

    ContentViewer.prototype.onPrevious = function () {
      if (currentIndex > 0) {
        currentIndex--;
        openDocumentAt(currentIndex, this);
      } else {
        console.log("ℹ️ Already at first document");
        updateNavigationButtons(this);
      }
    };

    // Automatically open the first document when the viewer is created
    aspect.after(ContentViewer.prototype, "postCreate", function () {
      if (!viewerInitialized && documents.documents.length > 0) {
        console.log("📂 ContentViewer created — auto-opening first document");
        viewerInitialized = true;
        currentIndex = 0;
        openDocumentAt(currentIndex, this);
      }
    });
  }

  // Register overrides after the desktop is loaded
  aspect.after(Desktop, "onDesktopLoaded", function () {
    console.log("🖥️ Desktop loaded — applying ContentViewer overrides");
    overrideContentViewerNavigation();
  });

});
