/*global chrome, _,$*/
(function (d) {
    "use strict";
    var Desk = {
        admin_url: function () {
			var url = 'http://admin.rutube.ru/admin/';
			if (this._tab_location) {
				url = this._tab_location.protocol + '//' +
				'admin.' +
				this._tab_location.host +
				'/admin/';
			}
			return url;
		},

        old_admin_url: function () {
			var url = 'http://admin.rutube.ru/cgi-bin/adm/';
			if (this._tab_location) {
				url = this._tab_location.protocol + '//' +
					'admin.'+
					'rutube.ru' +
					'/cgi-bin/adm/';
			}
			return url;
		},

        init: function () {
            _.bindAll(this,
				'admin_url',
				'old_admin_url',
                'editAuthor',
                'editOldAuthor',
				'editVideo',
                'metaVideo',
				'editOldVideo',
				'editSocialAccounts',
                'redirectAdminAuthor',
                'showMessage',
                'requestUserId',
                'requestOldUserId',
				'requestVideoId',
				'requestVideoMetaId',
				'requestOldVideoId',
				'requestSocial',
                'redirectOldAdminAuthor',
				'redirectAdminVideo',
				'redirectAdminVideoMeta',
				'redirectAdminVideoAddMeta',
				'redirectOldAdminVideo',
				'redirectSocial',
                'determinePage',
                'disableButtons');
            this.setListeners();
			this.message = $('#message');
            this.determinePage().always(this.disableButtons);
        },
        setListeners: function () {
            d.querySelector('#to-admin-author').addEventListener('click',this.editAuthor);
            d.querySelector('#to-old-admin-author').addEventListener('click',this.editOldAuthor);
			d.querySelector('#to-admin-video').addEventListener('click',this.editVideo);
			d.querySelector('#to-old-admin-video').addEventListener('click',this.editOldVideo);
			d.querySelector('#social-accounts-admin').addEventListener('click',this.editSocialAccounts);
            d.querySelector('#to-meta-video').addEventListener('click',this.metaVideo);

            chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
                if (request.action === 'foundUserId') {
					if (this._vpUIDdefer) {
						this._vpUIDdefer.resolve(request.value);
					}
                } else if (request.action === 'foundOldUserId') {
					if (this._vpOldUIDdefer) {
						this._vpOldUIDdefer.resolve(request.value);
					}
                } else if (request.action === 'foundOldVideoId') {
					if (this._oldTIDdefer) {
						this._oldTIDdefer.resolve(request.value);
					}
				}
            }.bind(this));
            
            chrome.webRequest.onHeadersReceived.addListener(
                function (headers) {
                    if (~headers.statusLine.indexOf('404')) {
                        this.redirectAdminVideoAddMeta();
                    } else {
                        this.video_id_meta = null;
                    }
                }.bind(this),
                {urls: ['*://*.rutube.ru/admin/metainfo/contenttvs/*']}
            );
        },

        disableButtons: function () {
            if (this._pagetype === 'person') {
                $('#to-old-admin-author').addClass('disabled');
                $('#to-admin-video').addClass('disabled');
                $('#to-old-admin-video').addClass('disabled');
				$('#to-meta-video').addClass('disabled');
            } else if (this._pagetype === 'unknown') {
				$('button').addClass('disabled');
            }
        },

        editAuthor: function (e) {
            e.preventDefault();
            //determine what page is it
            this.determinePage().then(
                this.requestUserId,
                this.showMessage);
        },

        requestUserId: function (tab) {
            chrome.tabs.query({'active': true}, function (tabs) {
				this.setActiveTab(tabs[0]);
                this.getUserId(tabs[0]).then(this.redirectAdminAuthor);
            }.bind(this));
        },

        redirectAdminAuthor: function (user_id) {
            if (user_id) {
                chrome.tabs.update(this._active_tab.id, {url: this.admin_url()+'accounts/user/'+user_id+'/'});
            } else {
                this.showMessage('Не удалось определить UID');
            }
        },

        editOldAuthor: function (e) {
            e.preventDefault();
            this.determinePage().then(
                this.requestOldUserId,
                this.showMessage
            );
        },

        requestOldUserId: function (tab) {
            chrome.tabs.query({'active': true}, function (tabs) {
				this.setActiveTab(tabs[0]);
                this.getOldUserId(tabs[0]).then(this.redirectOldAdminAuthor);
            }.bind(this));
        },

        redirectOldAdminAuthor: function (old_user_id) {
            if (old_user_id) {
                chrome.tabs.update(this._active_tab.id, {
                    url: this.old_admin_url()+'users.cgi?rm=info&id='+old_user_id+'/'
                });
            } else {
                this.showMessage('Не удалось определить UID');
            }
        },

		editVideo: function (e) {
			e.preventDefault();
			//determine what page is it/
			this.determinePage().then(
				this.requestVideoId,
				this.showMessage);
		},

		requestVideoId: function (tab) {
			chrome.tabs.query({'active': true}, function (tabs) {
				this.setActiveTab(tabs[0]);
				this.getVideoId(tabs[0]).then(this.redirectAdminVideo);
			}.bind(this));
		},

		redirectAdminVideo: function (video_id) {
			if (video_id) {
				chrome.tabs.update(this._active_tab.id, {url: this.admin_url()+'video/video/'+video_id+'/'});
			} else {
				this.showMessage('Не удалось определить UID');
			}
		},
        
        metaVideo: function (e) {
            e.preventDefault();
            this.determinePage().then(
				this.requestVideoMetaId,
				this.showMessage);
        },
        
        requestVideoMetaId: function (tab) {
			chrome.tabs.query({'active': true}, function (tabs) {
				this.setActiveTab(tabs[0]);
				this.getVideoId(tabs[0]).then(this.redirectAdminVideoMeta);
			}.bind(this));
		},
        
        redirectAdminVideoMeta: function (video_id) {
			if (video_id) {
                this.video_id_meta = video_id;
				chrome.tabs.update(this._active_tab.id, {url: this.admin_url()+'metainfo/contenttvs/'+video_id+'/'});
			} else {
				this.showMessage('Не удалось определить UID');
			}
		},
        
        redirectAdminVideoAddMeta: function () {
            if (this.video_id_meta) {
                chrome.tabs.update(this._active_tab.id, {url: this.admin_url() + 'metainfo/contenttvs/add'});
                chrome.tabs.executeScript(this._active_tab.id, {code: 'document.getElementById("id_video").value="' + this.video_id_meta + '"'});
                this.video_id_meta = null;
            }
		},

		/* noop */
		editOldVideo: function (e) {
			e.preventDefault();
			//determine what page is it/
			this.determinePage().then(
				this.requestOldVideoId,
				this.showMessage);
		},

		requestOldVideoId: function (tab) {
			chrome.tabs.query({'active': true}, function (tabs) {
				this.setActiveTab(tabs[0]);
				this.getOldVideoId(tabs[0]).then(this.redirectOldAdminVideo);
			}.bind(this));
		},

		redirectOldAdminVideo: function (video_id) {
			if (video_id) {
				chrome.tabs.update(this._active_tab.id, {url: this.old_admin_url()+'tracks.cgi?rm=play&id='+video_id});
			} else {
				this.showMessage('Не удалось определить UID');
			}
		},

		editSocialAccounts: function (e) {
			e.preventDefault();
			this.determinePage().then(
				this.requestSocial,
				this.showMessage);

		},

		requestSocial: function () {
			chrome.tabs.query({'active': true}, function (tabs) {
				this.setActiveTab(tabs[0]);
				this.getUserId(tabs[0]).then(this.redirectSocial);
			}.bind(this));
		},

		redirectSocial: function (user_id) {
			if (user_id) {
				chrome.tabs.update(this._active_tab.id,
					{url: this.admin_url()+'social/socialaccount/?user='+user_id});
				this.showMessage('Пожалуйста подождите ...');
			} else {
				this.showMessage('Не удалось определить UID');
			}
		},

        /** At the different pages related strategy applied */
        determinePage: function () {
            var personRE = /.*\/video\/person\/.*?/,
                videoRE = /.*\/video\/(\w{32})\/?.*/,
                videoPrivateRE = /.*\/video\/private\/(\w{32})\/?.*/,
                dfd = $.Deferred();
            chrome.tabs.query({'active': true}, function (tabs) {
                var url = tabs[0].url;
                if (personRE.test(url)) {
                    this._pagetype='person';
                    _.extend(this, UserPageStrategy);
                    _.bindAll(this,'getOldUserId','getUserId');
                    dfd.resolve(tabs[0]);
                } else if (videoRE.test(url) || videoPrivateRE.test(url)) {
                    this._pagetype='video';
                    _.extend(this, VideoPageStrategy);
                    dfd.resolve(tabs[0]);
                    _.bindAll(this,'getOldUserId','getUserId', 'getVideoId', 'getOldVideoId');
                } else {
                    this._pagetype='unknown';
                    dfd.reject('Вкладка не поддерживается');
                }
            }.bind(this));
            return dfd;
        },

		setActiveTab: function (tab) {
			this._active_tab = tab;
			this._tab_location = document.createElement('a');
			this._tab_location.href=tab.url;
		},

        showMessage: function (msg) {
			if (msg) {
				this.message.text(msg);
			}
        },

		clearMessage: function () {
			this.message.text('');
		}
    };


    /**
     * All methods accept params: tab, success callback
     * @type {Object}
     */
  var VideoPageStrategy = {
      getUserId: function (tab) {
          this._vpUIDdefer = $.Deferred();
          chrome.tabs.sendMessage(tab.id, {action: "findUserId"});
          return this._vpUIDdefer;
      },
      getOldUserId: function (tab) {
          this._vpOldUIDdefer = $.Deferred();
          this.getUserId(tab).then(function () {
              chrome.tabs.sendMessage(tab.id, {action: "findOldUserId"});
          }.bind(this));
          return this._vpOldUIDdefer;
      },

      getVideoId: function (tab) {
		var dfd = $.Deferred(),
			url = tab.url,
          //find 32-symbol sequence of the id
			re = /.*\/(\w{32})\/?.*/,
			video_id = re.exec(url)[1];
		return dfd.resolve(video_id);
      },

	getOldVideoId: function (tab) {
		this._oldTIDdefer = $.Deferred();
			chrome.tabs.sendMessage(tab.id, {action: "findOldVideoId"});
		return this._oldTIDdefer;
	}

  };

    var UserPageStrategy = {
        getUserId: function (tab) {
            var dfd = $.Deferred();
            var re = /\/video\/person\/(\d+)/;
            var id = re.exec(tab.url)[1];
            return dfd.resolve(id);
        },
        getOldUserId: function () {},
		getVideoId: function () {},
		getOldVideoId: function () {}
    };

    d.addEventListener('DOMContentLoaded', function () {
        Desk.init();
    });

}(document));

