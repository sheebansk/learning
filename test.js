define([
  "dojo/_base/declare",
  "ecm/widget/viewer/ContentViewer",
  "ecm/model/Repository",
  "ecm/model/ContentItem",
  "dojo/_base/lang"
], function(declare, ContentViewer, Repository, ContentItem, lang) {

  return declare("myplugin.CustomViewer", [ContentViewer], {

    postCreate: function() {
      this.inherited(arguments);

      var urlParams = new URLSearchParams(window.location.search);
      var repositoryId = urlParams.get("repositoryId");
      var docId = urlParams.get("docid");
      var vsId = urlParams.get("vsId");

      if (repositoryId && docId) {
        var repository = ecm.model.desktop.getRepository(repositoryId);

        if (!repository.connected) {
          repository.retrieveDesktop(lang.hitch(this, function() {
            this._loadItem(repository, docId, vsId);
          }));
        } else {
          this._loadItem(repository, docId, vsId);
        }
      }
    },

    _loadItem: function(repository, docId, vsId) {
      var item = new ContentItem({
        repository: repository,
        id: docId,
        vsId: vsId || null,
        retrieveItem: true
      });

      this.setItem(item);
    }
  });
});
