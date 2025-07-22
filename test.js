define([
  "dojo/aspect",
  "ecm/model/Desktop",
  "ecm/model/Item"
], function (aspect, Desktop, Item) {

  console.log("✅ Custom viewer.jsp plugin loaded");

  // 🗂️ Sample document configuration
  var documents = {
    repositoryId: "Repo1",
    documents: ["{doc1}", "{doc2}", "{doc3}"],
    classId: "Document",
    vsId: "VS_ID_123",
    version: "current"
  };

  var currentIndex = 0;

  function getViewerTab() {
    if (Desktop.mainContainer && typeof Desktop.mainContainer.getSelectedTab === "function") {
      return Desktop.mainContainer.getSelectedTab();
    } else {
      console.error("❌ mainContainer or getSelectedTab not available");
      return null;
    }
  }

  function openDocumentAt(index) {
    var viewerTab = getViewerTab();
    var docId = documents.documents[index];
    var repo = Desktop.getRepository(documents.repositoryId);

    if (!viewerTab || typeof viewerTab.openContentItem !== "function") {
      console.error("❌ Viewer tab or openContentItem not available");
      return;
    }

    if (!docId || !repo) {
      console.warn("⚠️ Invalid document or repository");
      return;
    }

    console.log("📄 Opening document:", docId);

    var item = new Item({
      repository: repo,
      id: docId,
      vsId: documents.vsId,
      className: documents.classId,
      versionSeriesId: documents.vsId,
      version: documents.version
    });

    viewerTab.openContentItem(item);
    updateNavigationButtons(viewerTab);
  }

  function updateNavigationButtons(viewerTab) {
    if (!viewerTab || !viewerTab._toolbar) return;

    var prevBtn = viewerTab._toolbar.lookup("Previous");
    var nextBtn = viewerTab._toolbar.lookup("Next");

    if (prevBtn) prevBtn.set("disabled", currentIndex === 0);
    if (nextBtn) nextBtn.set("disabled", currentIndex >= documents.documents.length - 1);

    console.log(`🔘 Navigation buttons updated — Prev: ${currentIndex === 0}, Next: ${currentIndex >= documents.documents.length - 1}`);
  }

  function overrideViewerNavigation() {
    var viewerTab = getViewerTab();
    if (!viewerTab) return;

    console.log("🔧 Overriding viewer tab navigation");

    viewerTab.onNext = function () {
      if (currentIndex < documents.documents.length - 1) {
        currentIndex++;
        openDocumentAt(currentIndex);
      } else {
        console.log("ℹ️ Already at last document");
        updateNavigationButtons(viewerTab);
      }
    };

    viewerTab.onPrevious = function () {
      if (currentIndex > 0) {
        currentIndex--;
        openDocumentAt(currentIndex);
      } else {
        console.log("ℹ️ Already at first document");
        updateNavigationButtons(viewerTab);
      }
    };

    // 🚀 Load the first document immediately
    currentIndex = 0;
    openDocumentAt(currentIndex);
  }

  aspect.after(Desktop, "onDesktopLoaded", function () {
    console.log("🖥️ Desktop loaded — applying viewer overrides");
    overrideViewerNavigation();
  });

});
