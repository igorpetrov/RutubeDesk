/*global chrome, $*/
(function () {
    "use strict";
    var user_id;

    chrome.extension.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.action === "findUserId") {
                var uid = findUserId();
                chrome.extension.sendMessage({action: "foundUserId", value:uid});
            } else if (request.action === "findOldUserId") {
                var sendUid = function(d) {
                    var j=$.parseJSON(d.responseText);
                    var acc=d.author.accounts, len=acc.length;
                    while(len--) {
                        if (acc[len].net == 2) {
                            var old_uid = acc[len].uid;
                            chrome.extension.sendMessage({action: "foundOldUserId", value:old_uid});
                        }
                    }
                };
                findOldUserId(sendUid);
            } else if (request.action === "findOldVideoId") {
				var vid = findOldVideoId();
				chrome.extension.sendMessage({action: "foundOldVideoId", value:vid});
			}
        });

    function findUserId () {
        var __link=document.querySelector('.b-author a[href^="/video/person"]');
        //__link.querySelector('a[href^="/video/person"]');
        var path = __link.pathname.split('/');
        user_id=path[path.length-2];
        return user_id;
    }

    function findOldUserId (success) {
		var tid = findOldVideoId();
        var url = '/api/play/trackinfo/'+tid+'/';
        if (location.href.indexOf('private') !== -1) {
            var re = /.*p=(\w{22}).*/;
            var p = re.exec(location.search)[1];
            url = url+'?p='+p;
        }
        $.get(url,success);
    }

	function findOldVideoId () {
		var a = document.createElement('a');
		a.href=$('iframe[src*="/play/embed"]').attr('src');
		var tid=a.pathname.split('/');
		tid=tid[tid.length-1];console.log('tid: ', tid);
		return tid;
	}
})();

