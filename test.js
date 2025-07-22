define([
  "dojo/aspect",
  "ecm/model/Desktop",
  "ecm/model/Item",
  "ecm/widget/viewer/ContentViewer"
], function (aspect, Desktop, Item, ContentViewer) {

  console.log("✅ Custom Viewer Navigation Plugin Loaded");

  // 📄 Define your custom document list
  var documents = {
    repositoryId: "Repo1",
    documents: ["{doc1}", "{doc2}", "{doc3}"],
    classId: "Document",
    vsId: "VS_ID_123",
    version: "current",
    templateId: null
  };

  var currentIndex = 0;
  var viewerInitialized = false;

  // ✅ Universal way to get the actual viewer pane
  function getViewerPane() {
    if (Desktop.getViewer && typeof Desktop.getViewer === "function") {
      return Desktop.getViewer();
    }
    if (Desktop.mainContentArea && Desktop.mainContentArea.viewer) {
      return Desktop.mainContentArea.viewer;
    }
    console.warn("❌ Viewer pane not found");
    return null;
  }

  // ✅ Load a document at a specific index
  function openDocumentAt(index) {
    if (!documents.documents || documents.documents.length === 0) {
      console.warn("⚠️ Document list is empty");
      return;
    }

    var docId = documents.documents[index];
    var repository = Desktop.getRepository(documents.repositoryId);

    if (!docId || !repository) {
      console.warn("⚠️ Invalid document ID or repository");
      return;
    }

    console.log("📄 Opening document at index", index, docId);

    var item = new Item({
      repository: repository,
      id: docId,
      vsId: documents.vsId,
      className: documents.classId,
      versionSeriesId: documents.vsId,
      version: documents.version,
      template: documents.templateId || null
    });

    var viewerPane = getViewerPane();
    if (viewerPane && typeof viewerPane.openContentItem === "function") {
      viewerPane.openContentItem(item);
    } else {
      console.error("❌ Cannot open document: viewerPane or openContentItem not available");
    }

    updateNavigationButtons();
  }

  // ✅ Enable/Disable Previous & Next buttons
  function updateNavigationButtons() {
    var viewerPane = getViewerPane();
    if (!viewerPane || !viewerPane._toolbar) return;

    var prevBtn = viewerPane._toolbar.lookup("Previous");
    var nextBtn = viewerPane._toolbar.lookup("Next");

    if (prevBtn) prevBtn.set("disabled", currentIndex === 0);
    if (nextBtn) nextBtn.set("disabled", currentIndex >= documents.documents.length - 1);

    console.log(
      `🔘 Buttons updated — Previous: ${currentIndex === 0 ? "Disabled" : "Enabled"}, Next: ${currentIndex >= documents.documents.length - 1 ? "Disabled" : "Enabled"}`
    );
  }

  // ✅ Override ContentViewer navigation
  function overrideViewerNavigation() {
    console.log("🔧 Overriding ContentViewer onNext/onPrevious");

    ContentViewer.prototype.onNext = function () {
      if (currentIndex < documents.documents.length - 1) {
        currentIndex++;
        openDocumentAt(currentIndex);
      } else {
        console.log("ℹ️ Already at last document");
        updateNavigationButtons();
      }
    };

    ContentViewer.prototype.onPrevious = function () {
      if (currentIndex > 0) {
        currentIndex--;
        openDocumentAt(currentIndex);
      } else {
        console.log("ℹ️ Already at first document");
        updateNavigationButtons();
      }
    };

    // Auto-open the first document when viewer is created
    aspect.after(ContentViewer.prototype, "postCreate", function () {
      if (!viewerInitialized && documents.documents.length > 0) {
        console.log("📂 Viewer created — auto-opening first document");
        viewerInitialized = true;
        currentIndex = 0;
        openDocumentAt(currentIndex);
      }
    });
  }

  // ✅ Start plugin when Desktop is ready
  aspect.after(Desktop, "onDesktopLoaded", function () {
    console.log("🖥️ Desktop loaded — initializing viewer override plugin");
    overrideViewerNavigation();
  });

});
