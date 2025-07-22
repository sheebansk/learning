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

  // ✅ Enhanced way to get the actual viewer pane
  function getViewerPane() {
    // Method 1: Check Desktop.getViewer()
    if (Desktop.getViewer && typeof Desktop.getViewer === "function") {
      var viewer = Desktop.getViewer();
      if (viewer) {
        console.log("📺 Found viewer via Desktop.getViewer()");
        return viewer;
      }
    }

    // Method 2: Check mainContentArea
    if (Desktop.mainContentArea && Desktop.mainContentArea.viewer) {
      console.log("📺 Found viewer via Desktop.mainContentArea.viewer");
      return Desktop.mainContentArea.viewer;
    }

    // Method 3: Check contentViewerStackContainer
    if (Desktop.contentViewerStackContainer) {
      var selectedChild = Desktop.contentViewerStackContainer.selectedChildWidget;
      if (selectedChild) {
        console.log("📺 Found viewer via contentViewerStackContainer");
        return selectedChild;
      }
    }

    // Method 4: Look for ContentViewer instances in registry
    var registry = require("dijit/registry");
    var viewers = registry.filter(function(widget) {
      return widget.declaredClass === "ecm.widget.viewer.ContentViewer";
    });
    
    if (viewers.length > 0) {
      console.log("📺 Found viewer via registry search");
      return viewers[0];
    }

    console.warn("❌ Viewer pane not found using any method");
    return null;
  }

  // ✅ Enhanced document opening with multiple fallback methods
  function openDocumentAt(index) {
    if (!documents.documents || documents.documents.length === 0) {
      console.warn("⚠️ Document list is empty");
      return;
    }

    var docId = documents.documents[index];
    var repository = Desktop.getRepository(documents.repositoryId);

    if (!docId || !repository) {
      console.warn("⚠️ Invalid document ID or repository", { docId: docId, repository: repository });
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
    if (!viewerPane) {
      console.error("❌ Cannot open document: viewerPane not found");
      return;
    }

    // Method 1: Try openContentItem
    if (typeof viewerPane.openContentItem === "function") {
      console.log("🔧 Using openContentItem method");
      viewerPane.openContentItem(item);
    }
    // Method 2: Try openItem
    else if (typeof viewerPane.openItem === "function") {
      console.log("🔧 Using openItem method");
      viewerPane.openItem(item);
    }
    // Method 3: Try viewDocument
    else if (typeof viewerPane.viewDocument === "function") {
      console.log("🔧 Using viewDocument method");
      viewerPane.viewDocument(item);
    }
    // Method 4: Try setContentItem
    else if (typeof viewerPane.setContentItem === "function") {
      console.log("🔧 Using setContentItem method");
      viewerPane.setContentItem(item);
    }
    // Method 5: Try direct content setting
    else if (viewerPane.set && typeof viewerPane.set === "function") {
      console.log("🔧 Using set method with contentItem");
      viewerPane.set("contentItem", item);
    }
    else {
      console.error("❌ No suitable method found on viewerPane:", Object.keys(viewerPane));
      console.log("Available methods:", Object.getOwnPropertyNames(viewerPane).filter(function(prop) {
        return typeof viewerPane[prop] === 'function';
      }));
      return;
    }

    // Update navigation after successful opening
    setTimeout(function() {
      updateNavigationButtons();
    }, 100);
  }

  // ✅ Enhanced button update with better error handling
  function updateNavigationButtons() {
    var viewerPane = getViewerPane();
    if (!viewerPane) {
      console.warn("⚠️ ViewerPane not available for button updates");
      return;
    }

    // Try different toolbar access methods
    var toolbar = viewerPane._toolbar || viewerPane.toolbar || viewerPane.getToolbar?.();
    
    if (!toolbar) {
      console.warn("⚠️ Toolbar not found on viewerPane");
      return;
    }

    var prevBtn = toolbar.lookup?.("Previous") || toolbar.getWidget?.("Previous");
    var nextBtn = toolbar.lookup?.("Next") || toolbar.getWidget?.("Next");

    if (prevBtn && typeof prevBtn.set === "function") {
      prevBtn.set("disabled", currentIndex === 0);
    }
    if (nextBtn && typeof nextBtn.set === "function") {
      nextBtn.set("disabled", currentIndex >= documents.documents.length - 1);
    }

    console.log(
      `🔘 Buttons updated — Previous: ${currentIndex === 0 ? "Disabled" : "Enabled"}, Next: ${currentIndex >= documents.documents.length - 1 ? "Disabled" : "Enabled"}`
    );
  }

  // ✅ Enhanced navigation override with better timing
  function overrideViewerNavigation() {
    console.log("🔧 Overriding ContentViewer onNext/onPrevious");

    ContentViewer.prototype.onNext = function () {
      console.log("➡️ Next button clicked, currentIndex:", currentIndex);
      if (currentIndex < documents.documents.length - 1) {
        currentIndex++;
        openDocumentAt(currentIndex);
      } else {
        console.log("ℹ️ Already at last document");
        updateNavigationButtons();
      }
    };

    ContentViewer.prototype.onPrevious = function () {
      console.log("⬅️ Previous button clicked, currentIndex:", currentIndex);
      if (currentIndex > 0) {
        currentIndex--;
        openDocumentAt(currentIndex);
      } else {
        console.log("ℹ️ Already at first document");
        updateNavigationButtons();
      }
    };

    // Enhanced auto-open with better timing and error handling
    aspect.after(ContentViewer.prototype, "postCreate", function () {
      var self = this;
      console.log("📂 ContentViewer postCreate called");
      
      if (!viewerInitialized && documents.documents.length > 0) {
        console.log("📂 Initializing viewer with first document");
        viewerInitialized = true;
        currentIndex = 0;
        
        // Delay the opening to ensure the viewer is fully ready
        setTimeout(function() {
          openDocumentAt(currentIndex);
        }, 500);
      }
    });

    // Also hook into onShow to ensure viewer is ready
    aspect.after(ContentViewer.prototype, "onShow", function () {
      console.log("👁️ ContentViewer onShow called");
      if (documents.documents.length > 0) {
        setTimeout(function() {
          updateNavigationButtons();
        }, 100);
      }
    });
  }

  // ✅ Enhanced initialization with better timing
  function initializePlugin() {
    console.log("🖥️ Initializing viewer override plugin");
    overrideViewerNavigation();
    
    // Also try to initialize immediately if desktop is already loaded
    if (Desktop.isLoaded && Desktop.isLoaded()) {
      console.log("🖥️ Desktop already loaded, initializing immediately");
      setTimeout(function() {
        if (documents.documents.length > 0 && !viewerInitialized) {
          openDocumentAt(0);
        }
      }, 1000);
    }
  }

  // ✅ Multiple initialization hooks for better reliability
  if (Desktop.onDesktopLoaded) {
    aspect.after(Desktop, "onDesktopLoaded", initializePlugin);
  }

  // Fallback initialization
  setTimeout(function() {
    if (!viewerInitialized) {
      console.log("🔄 Fallback initialization triggered");
      initializePlugin();
    }
  }, 2000);

  // Return an object to expose functions for debugging
  return {
    openDocumentAt: openDocumentAt,
    getViewerPane: getViewerPane,
    updateNavigationButtons: updateNavigationButtons,
    getCurrentIndex: function() { return currentIndex; },
    setCurrentIndex: function(index) { currentIndex = index; },
    getDocuments: function() { return documents; }
  };

});