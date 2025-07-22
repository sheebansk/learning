define([
  "dojo/aspect",
  "dojo/on",
  "dojo/topic",
  "dojo/ready",
  "ecm/model/Desktop",
  "ecm/model/Item",
  "ecm/widget/viewer/ContentViewer",
  "dijit/registry"
], function (aspect, on, topic, ready, Desktop, Item, ContentViewer, registry) {

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
  var activeViewer = null;
  var retryCount = 0;
  var maxRetries = 10;

  // ✅ Comprehensive viewer detection with polling
  function findViewerPane() {
    console.log("🔍 Searching for viewer pane... (attempt " + (retryCount + 1) + ")");

    // Method 1: Direct Desktop methods
    if (Desktop.getViewer && typeof Desktop.getViewer === "function") {
      var viewer = Desktop.getViewer();
      if (viewer) {
        console.log("✅ Found viewer via Desktop.getViewer()");
        return viewer;
      }
    }

    // Method 2: Main content area
    if (Desktop.mainContentArea) {
      if (Desktop.mainContentArea.viewer) {
        console.log("✅ Found viewer via Desktop.mainContentArea.viewer");
        return Desktop.mainContentArea.viewer;
      }
      if (Desktop.mainContentArea.selectedChildWidget) {
        var selected = Desktop.mainContentArea.selectedChildWidget;
        if (selected.declaredClass && selected.declaredClass.indexOf("ContentViewer") !== -1) {
          console.log("✅ Found viewer via mainContentArea.selectedChildWidget");
          return selected;
        }
      }
    }

    // Method 3: Content viewer stack
    if (Desktop.contentViewerStackContainer) {
      var stack = Desktop.contentViewerStackContainer;
      if (stack.selectedChildWidget) {
        console.log("✅ Found viewer via contentViewerStackContainer");
        return stack.selectedChildWidget;
      }
    }

    // Method 4: Search registry for ContentViewer instances
    var viewers = registry.filter(function(widget) {
      return widget.declaredClass && (
        widget.declaredClass === "ecm.widget.viewer.ContentViewer" ||
        widget.declaredClass.indexOf("ContentViewer") !== -1
      );
    });
    
    if (viewers.length > 0) {
      console.log("✅ Found viewer via registry search:", viewers[0].declaredClass);
      return viewers[0];
    }

    // Method 5: Search by ID patterns
    var possibleIds = ["contentViewer", "viewer", "documentViewer"];
    for (var i = 0; i < possibleIds.length; i++) {
      var widget = registry.byId(possibleIds[i]);
      if (widget) {
        console.log("✅ Found viewer by ID:", possibleIds[i]);
        return widget;
      }
    }

    console.warn("⚠️ No viewer found in attempt " + (retryCount + 1));
    return null;
  }

  // ✅ Wait for viewer with polling and promises
  function waitForViewer() {
    return new Promise(function(resolve, reject) {
      function checkViewer() {
        var viewer = findViewerPane();
        if (viewer) {
          activeViewer = viewer;
          resolve(viewer);
          return;
        }

        retryCount++;
        if (retryCount >= maxRetries) {
          reject(new Error("Viewer not found after " + maxRetries + " attempts"));
          return;
        }

        setTimeout(checkViewer, 1000); // Wait 1 second between attempts
      }
      
      checkViewer();
    });
  }

  // ✅ Enhanced document opening with comprehensive error handling
  function openDocumentAt(index) {
    if (!documents.documents || documents.documents.length === 0) {
      console.warn("⚠️ Document list is empty");
      return Promise.reject("Document list is empty");
    }

    var docId = documents.documents[index];
    var repository = Desktop.getRepository(documents.repositoryId);

    if (!docId || !repository) {
      console.warn("⚠️ Invalid document ID or repository", { docId: docId, repository: repository });
      return Promise.reject("Invalid document or repository");
    }

    console.log("📄 Opening document at index", index, ":", docId);

    return waitForViewer().then(function(viewer) {
      var item = new Item({
        repository: repository,
        id: docId,
        vsId: documents.vsId,
        className: documents.classId,
        versionSeriesId: documents.vsId,
        version: documents.version,
        template: documents.templateId || null
      });

      // Try different methods to open the document
      var methods = [
        { name: "openContentItem", fn: function() { viewer.openContentItem(item); }},
        { name: "openItem", fn: function() { viewer.openItem(item); }},
        { name: "viewDocument", fn: function() { viewer.viewDocument(item); }},
        { name: "setContentItem", fn: function() { viewer.setContentItem(item); }},
        { name: "set contentItem", fn: function() { viewer.set("contentItem", item); }},
        { name: "showDocument", fn: function() { viewer.showDocument(item); }},
        { name: "loadDocument", fn: function() { viewer.loadDocument(item); }}
      ];

      var opened = false;
      for (var i = 0; i < methods.length; i++) {
        try {
          if (typeof methods[i].fn === "function") {
            console.log("🔧 Trying method:", methods[i].name);
            methods[i].fn();
            console.log("✅ Successfully opened document using:", methods[i].name);
            opened = true;
            break;
          }
        } catch (e) {
          console.log("❌ Method", methods[i].name, "failed:", e.message);
        }
      }

      if (!opened) {
        console.error("❌ All opening methods failed. Available methods on viewer:");
        console.log(Object.getOwnPropertyNames(viewer).filter(function(prop) {
          return typeof viewer[prop] === 'function' && prop.toLowerCase().indexOf('open') !== -1;
        }));
        throw new Error("No suitable method found to open document");
      }

      // Update navigation after successful opening
      setTimeout(function() {
        updateNavigationButtons();
      }, 200);

      return viewer;
    }).catch(function(error) {
      console.error("❌ Failed to open document:", error);
      throw error;
    });
  }

  // ✅ Enhanced button management
  function updateNavigationButtons() {
    if (!activeViewer) {
      console.warn("⚠️ No active viewer for button updates");
      return;
    }

    // Try different ways to get toolbar
    var toolbar = activeViewer._toolbar || 
                  activeViewer.toolbar || 
                  (activeViewer.getToolbar && activeViewer.getToolbar()) ||
                  activeViewer._toolBar ||
                  activeViewer.toolBar;
    
    if (!toolbar) {
      console.warn("⚠️ Toolbar not found on viewer");
      return;
    }

    // Try different ways to get buttons
    var prevBtn = (toolbar.lookup && toolbar.lookup("Previous")) || 
                  (toolbar.getWidget && toolbar.getWidget("Previous")) ||
                  (toolbar.getButton && toolbar.getButton("Previous"));
                  
    var nextBtn = (toolbar.lookup && toolbar.lookup("Next")) || 
                  (toolbar.getWidget && toolbar.getWidget("Next")) ||
                  (toolbar.getButton && toolbar.getButton("Next"));

    if (prevBtn && typeof prevBtn.set === "function") {
      prevBtn.set("disabled", currentIndex === 0);
    }
    if (nextBtn && typeof nextBtn.set === "function") {
      nextBtn.set("disabled", currentIndex >= documents.documents.length - 1);
    }

    console.log(`🔘 Navigation updated - Previous: ${currentIndex === 0 ? "Disabled" : "Enabled"}, Next: ${currentIndex >= documents.documents.length - 1 ? "Disabled" : "Enabled"}`);
  }

  // ✅ Navigation override with promise handling
  function overrideViewerNavigation() {
    console.log("🔧 Setting up ContentViewer navigation overrides");

    ContentViewer.prototype.onNext = function () {
      console.log("➡️ Next navigation triggered, currentIndex:", currentIndex);
      if (currentIndex < documents.documents.length - 1) {
        currentIndex++;
        openDocumentAt(currentIndex).catch(function(error) {
          console.error("Failed to navigate to next document:", error);
        });
      } else {
        console.log("ℹ️ Already at last document");
        updateNavigationButtons();
      }
    };

    ContentViewer.prototype.onPrevious = function () {
      console.log("⬅️ Previous navigation triggered, currentIndex:", currentIndex);
      if (currentIndex > 0) {
        currentIndex--;
        openDocumentAt(currentIndex).catch(function(error) {
          console.error("Failed to navigate to previous document:", error);
        });
      } else {
        console.log("ℹ️ Already at first document");
        updateNavigationButtons();
      }
    };

    // Hook into viewer lifecycle events
    aspect.after(ContentViewer.prototype, "postCreate", function () {
      console.log("📂 ContentViewer postCreate - widget created");
      var self = this;
      
      // Set this as the active viewer
      activeViewer = self;
      
      if (!viewerInitialized && documents.documents.length > 0) {
        viewerInitialized = true;
        currentIndex = 0;
        
        setTimeout(function() {
          console.log("📂 Auto-opening first document");
          openDocumentAt(currentIndex);
        }, 1000);
      }
    });

    aspect.after(ContentViewer.prototype, "startup", function () {
      console.log("🚀 ContentViewer startup completed");
      activeViewer = this;
      setTimeout(updateNavigationButtons, 500);
    });

    aspect.after(ContentViewer.prototype, "onShow", function () {
      console.log("👁️ ContentViewer shown");
      activeViewer = this;
      setTimeout(updateNavigationButtons, 200);
    });
  }

  // ✅ Topic-based initialization for better event handling
  function setupTopicListeners() {
    // Listen for desktop events
    topic.subscribe("ecm/model/desktop/onLogin", function() {
      console.log("🔐 Desktop login detected");
      setTimeout(initializeNavigation, 1000);
    });

    topic.subscribe("ecm/model/desktop/onDesktopLoaded", function() {
      console.log("🖥️ Desktop loaded via topic");
      setTimeout(initializeNavigation, 500);
    });

    // Listen for content viewer events if available
    topic.subscribe("ecm/widget/viewer/contentViewerCreated", function(viewer) {
      console.log("📺 Content viewer created via topic");
      activeViewer = viewer;
      setTimeout(function() {
        if (!viewerInitialized) {
          initializeNavigation();
        }
      }, 500);
    });
  }

  // ✅ Main initialization function
  function initializeNavigation() {
    console.log("🎯 Initializing navigation system");
    
    if (viewerInitialized) {
      console.log("ℹ️ Navigation already initialized");
      return;
    }

    overrideViewerNavigation();
    
    // Try to open first document if we have a viewer
    waitForViewer().then(function(viewer) {
      console.log("✅ Viewer found, opening first document");
      viewerInitialized = true;
      currentIndex = 0;
      return openDocumentAt(currentIndex);
    }).catch(function(error) {
      console.error("❌ Failed to initialize navigation:", error);
    });
  }

  // ✅ Multiple initialization strategies
  ready(function() {
    console.log("📋 DOM ready, setting up plugin");
    setupTopicListeners();
    
    // Try immediate initialization
    setTimeout(initializeNavigation, 2000);
    
    // Setup desktop hooks if available
    if (Desktop && Desktop.onDesktopLoaded) {
      aspect.after(Desktop, "onDesktopLoaded", function() {
        console.log("🖥️ Desktop loaded via aspect");
        setTimeout(initializeNavigation, 1000);
      });
    }
    
    // Fallback polling initialization
    var pollCount = 0;
    var pollInterval = setInterval(function() {
      if (viewerInitialized || pollCount > 20) {
        clearInterval(pollInterval);
        return;
      }
      
      pollCount++;
      console.log("🔄 Polling initialization attempt:", pollCount);
      
      if (Desktop.isLoaded && Desktop.isLoaded()) {
        initializeNavigation();
      }
    }, 3000);
  });

  // ✅ Public API for debugging and manual control
  return {
    openDocumentAt: openDocumentAt,
    findViewerPane: findViewerPane,
    waitForViewer: waitForViewer,
    updateNavigationButtons: updateNavigationButtons,
    getCurrentIndex: function() { return currentIndex; },
    setCurrentIndex: function(index) { currentIndex = index; },
    getDocuments: function() { return documents; },
    getActiveViewer: function() { return activeViewer; },
    forceInitialize: initializeNavigation,
    reset: function() { 
      viewerInitialized = false; 
      activeViewer = null; 
      retryCount = 0; 
      currentIndex = 0;
    }
  };

});