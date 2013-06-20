/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

var proclaim = new kendo.data.ObservableObject({
	groupId: config.proclaim.groupId,
	channelId: null,
	signals: [],
	
	dsSignals: new kendo.data.DataSource({
		data: []
	}), 
	
	init: function() {
		console.log("proclaim module initialized");
		
		$(document).bind("app-init", function(e) {
			proclaim.initEvents();
		});
	},
	
	initEvents: function() {
		var url = config.proclaim.baseUrl + config.proclaim.endpoint;
		fm.websync.client.initialize({ 
			requestUrl: url,
			onSuccess: function(args) {
				console.log("initialized websync client");
			},
			onFailure: function(args) {
				alert("error initializing websync client:\n" + args.error);
			}
		});
		
		$(document).on("presentation-started", function(e) {
			if (e.response.onAir[0].id) {
				proclaim.set("channelId", e.response.onAir[0].id);
				proclaim.getSignals(proclaim.get("channelId"), function(data) {
					proclaim.displaySignals(data.activeSignalIds);
					proclaim.connect(function() {
						proclaim.subscribe(proclaim.get("channelId"), "signaled");
						proclaim.subscribe(proclaim.get("channelId"), "stopped");
					});
				});
			}
		});
		
		proclaim.checkForPresentation(proclaim.get("groupId"));
	},
	
	bannerDragStart: function(e) {
		var pos = e.touch.target.offset().left;
		e.touch.target.css("-webkit-transition", "all 0");
		e.touch.target.data("drag-left", e.touch.x.location - pos);
	},
	
	bannerDrag: function(e) {
		var pos = e.touch.target.data("drag-left");
		var newPos = e.touch.x.location - pos;
		e.touch.target.css("transform", "translateX(" + newPos + "px)");
	},
	
	bannerDragEnd: function(e) {
		var pos = e.touch.target.data("drag-left");
		var newPos = e.touch.x.location - pos;
		if (Math.abs(newPos) >= e.touch.target.width()*.667) {
			e.touch.target.css("-webkit-transition", "all 200ms").css("transform", "translateX(" + e.touch.target.width()*(newPos > 0 ? 1 : -1) + "px)");
			setTimeout(function() {
				e.touch.target.css("-webkit-transition", "all 0");
				e.touch.target.css("transform", "translateX(0)").css("bottom", "0");
			}, 200);
		}
		else {
			e.touch.target.css("-webkit-transition", "all 200ms").css("transform", "translateX(0)");
			setTimeout(function() {
				e.touch.target.css("-webkit-transition", "all 0");
			}, 200);
		}
	},
	
	checkForPresentation: function(groupId, interval) {
		console.log("check presentation");
		if (!interval) interval = 5000;
		$.ajax({
			url: config.proclaim.baseUrl + "?groupIds=" + groupId,
			type: "GET",
			dataType: "json",
			success: function(response) {
				if (response.onAir && response.onAir.length > 0) {
					var event = $.Event("presentation-started");
					event.response = response;
					$(document).trigger(event);
				}
				else {
					setTimeout(function() { proclaim.checkForPresentation(groupId); }, interval);
				}
			},
			error: function(xhr, status, errorThrown) {
				console.log(errorThrown);
			}
		});
	},

	getSignals: function(channelId, success) {
		$.ajax({
			url: config.proclaim.baseUrl + "/" + channelId + "/signals",
			type: "GET",
			dataType: "json",
			success: function(response) {
				console.log(response.signals.length + " signals found");
				proclaim.set("signals", response.signals);
				if (typeof success == "function") {
					success(response);
				}
			},
			error: function(xhr, status, errorThrown) {
				console.log(errorThrown);
			}
		});
	},

	connect: function(onConnected) {
		console.log("Connecting...");
		fm.websync.client.connect({
			onSuccess: function(args) {
				console.log("Connected!");
				if (typeof onConnected == "function") {
					onConnected(args);
				}
			},
			onFailure: function(args) {
				alert("connect failure");
				console.log("Could not connect: " + args.error);
			},
			onStreamFailure: function(args) {
				alert("stream failure");
				if (args.willReconnect) console.log("Connection to server lost, reconnecting...");
				else console.log("Connection to server lost permanently.");
			}
		});
	},

	subscribe: function(channelId, path) {
		fm.websync.client.subscribe({
			channel: "/onair/" + channelId + "/" + path,
			onSuccess: function(args) {
				console.log('Subscribed: ' + path);
			},
			onFailure: function(args) {
				console.log('Could not subscribe: ' + args.error);
			},
			onReceive: function(args) {
				// stopped
				if (args.channel.indexOf("/stopped") > -1) {
					proclaim.set("signals", []);
					proclaim.unsubscribe(args.channel);
					proclaim.unsubscribe(args.channel.replace("/stoppped", "/signaled"), function(args) {
						proclaim.checkForPresentation(proclaim.get("groupId"));
					});
				}
				
				// signaled
				if (args.data.signalIds) {
					proclaim.displaySignals(args.data.signalIds);
				}
			}
		});
	},

	unsubscribe: function(channel, success) {
		fm.websync.client.unsubscribe({
			channel: channel,
			onSuccess: function(args) {
				console.log('Unsubscribed!');
				if (typeof success == "function") {
					success(args);
				}
			},
			onFailure: function(args) {
				console.log('Could not unsubscribe: ' + args.error);
			}
		});
	},
	
	displaySignals: function(signalIds) {
		if ($("#list-proclaim-signals").data("kendoMobileListView") == null) {
			$("#list-proclaim-signals").kendoMobileListView({
				dataSource: proclaim.get("dsSignals"),
				autoBind: false,
				useNative: true,
				template: $("#template-proclaim-signal").html(),
				click: function(e) {
					
				}
			});
		}
		var signals = proclaim.get("signals");
		console.log("Active Signals: " + signalIds.length);
		$("#divTouch").css("-webkit-transition", "all 200ms");
		if (signalIds.length > 0) {
			$("#divTouch").css("bottom", "50px");
		}
		else {
			$("#divTouch").css("bottom", "-40px");
		}
		
		for(var i=0; i < signalIds.length;i++) {
			for(var j=0;j < signals.length;j++) {
				if (signals[j].id == signalIds[i]) {
					var item = null;
					var sig = signals[j];
					switch (sig.signalKind.toLowerCase()) {
						case "webaddress":
							item = { id: sig.id, type: sig.signalKind, icon: "]", title: sig.parameters.Uri };
							break;
						case "biblereference":
							var item = { id: sig.id, type: sig.signalKind, icon: "K", title: sig.parameters.Reference };
							break;
					}
					var exists = false;
					for(var x=0;x < proclaim.get("dsSignals").data().length;x++) {
						if (proclaim.get("dsSignals").data()[x].id == item.id) {
							exists = true;
							break;
						}
					}
					if (!exists) {
						proclaim.get("dsSignals").data().push(item);
						setTimeout(function() {
							$("#" + item.id)[0].scrollIntoView(true);
						},30);
					}
					else {
						setTimeout(function() {
							$("#" + item.id)[0].scrollIntoView(false);
						},30);
					}
					
				}
			}
		}
	}
});

proclaim.init();