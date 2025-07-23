require([
  "dijit/registry",
  "ecm/model/Repository",
  "ecm/model/ContentItem",
  "dojo/_base/lang"
], function(registry, Repository, ContentItem, lang) {
  
  var viewer = registry.byId("contentViewerPane");
  if (!viewer) {
    console.error("❌ contentViewerPane not found");
    return;
  }

  // Read URL parameters
  var params = new URLSearchParams(window.location.search);
  var repositoryId = params.get("repositoryId");
  var docid = params.get("docid");
  var vsId = params.get("vsId");

  if (!repositoryId || !docid) {
    console.warn("Missing repositoryId or docid in URL");
    return;
  }

  var repository = ecm.model.desktop.getRepository(repositoryId);

  function loadItem() {
    var item = new ContentItem({
      repository: repository,
      id: docid,
      vsId: vsId || null,
      retrieveItem: true
    });

    console.log("✅ Setting item on viewer");
    viewer.setItem(item);
  }

  // Check if repository is connected
  if (!repository || !repository.connected) {
    repository.retrieveDesktop(lang.hitch(this, function() {
      console.log("🔁 Repository connected");
      loadItem();
    }));
  } else {
    loadItem();
  }

});
