/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

var media = new kendo.data.ObservableObject({
	// properties
	currentItem: null,
	currentCategory: null,
	currentMediaIndex: -1,
	previousMediaIndex: -1,
	currentFeedTitle: "",
	device: kendo.support.mobileOS.device,
	hasLoadedOnce: null,

	// datasources
	dsCategories: new kendo.data.DataSource({
		data: []
	}),
	
	dsFeedAll: new kendo.data.DataSource({
	    data: []
	}),
	
	dsFeed: new kendo.data.DataSource({
	    data: []
	}),


	// dependent methods 
	mediaItemTitle: function() {
		if (media.get("currentItem").get("thumbnail").length > 0) {
			return "<small>" + media.get("currentItem").get("title") + " - " + media.get("currentItem").get("displayDate") + "</small>";
		}
		else {
			return media.get("currentItem").get("displayDate");
		}
	},
	
	hasCategory: function() {
		return media.get("currentCategory") != null;
	},

	hasThumbnail: function() {
		return media.get("currentItem").get("thumbnail").length > 0;
	},
	
	hasAudio: function() {
		return media.get("currentItem").get("urlAudio").length > 0;
	},
	
	hasVideo: function() {
		return media.get("currentItem").get("urlVideo").length > 0;
	},
	
	isContentType: function() {
		return media.get("currentItem").get("type") == "content";
	},
	
	itemDescription: function() {
		if (media.get("currentItem") != null) {
			return media.get("currentItem").description.replace(/\n\n\d+\/\d+\/\d+/,"");
		}
		return "";
	},
	
	itemDescriptionHtml: function() {
		if (media.get("currentItem") != null && media.get("currentItem").html.length > 0) {
			return media.get("currentItem").html;
		}
		return "";
	},
	
	hasDisplayDate: function() {
		return media.get("currentItem").get("displayDate").length > 0;
	},
	
	
	// methods
	init: function() {
		$(document).live("orientation-change", function(e) {
			if ($("video").length > 0) {
				media.positionVideoTag($("video"));
			}
			if ($("iframe").length > 0) {
				media.positionIframe($("iframe"));
			}
		});
		if (media.get("device") == undefined) {
			media.set("device","iphone");
		}
		console.log("media module initialized");
		
	},

	positionVideoTag: function(player) {
		var thumb = $("#thumb-image");
		console.log("top: " + thumb.offset().top + "/left: " + thumb.offset().left);
		player.css("position", "absolute").css("top", thumb.offset().top-37).css("left", thumb.offset().left);
		player.css("width", thumb.width()).css("height", thumb.height());
	},
	
	positionIframe: function(iframe) {
		var thumb = $("#thumb-image");
		var top = thumb.offset().top - 37;
		var left = thumb.offset().left;
		iframe.css("position", "absolute").css("top", top).css("left", left);
		iframe.css("width", thumb.width()).css("height", thumb.height());
	},
	
	backMediaCategories: function(e) {
		app.navigate("media-categories", config.kendoTransition + " reverse");
	},
	
	backMediaFeed: function(e) {
		if (media.get("dsFeed").data().length == 1 && config.media[media.get("currentMediaIndex")].neverShowOneItem != null && config.media[media.get("currentMediaIndex")].neverShowOneItem) {
			app.navigate("home", config.kendoTransition + " reverse");
		}
		else {
			app.navigate("mediafeed", config.kendoTransition + " reverse");
		}
	},
	
	initMediaCategoriesView: function(e) {
		console.log("initMediaCategoriesView");
		if ($("#list-mediacategories").data("kendoMobileListView") == null) {
			$("#list-mediacategories").kendoMobileListView({
				dataSource: media.get("dsCategories"),
				autoBind: true,
				template: $("#template-media-category").html(),
				click: function(e) {
					media.set("currentCategory", e.dataItem);
					var category = e.dataItem.text;
					var allItems = media.get("dsFeedAll").data();
					var items = new kendo.data.ObservableArray([]);
					for (var i=0;i < allItems.length;i++) {
						if (allItems[i].category == category) {
							items.push(allItems[i]);
						}	
					}
					media.get("dsFeed").data(items);
					app.navigate("mediafeed?reset=1");
				}
			});
		}
	},
	
	beforeShowMediaCategoriesView: function(e) {
		console.log("beforeShowMediaCategoriesView");
		
	},
	
	showMediaCategoriesView: function(e) {
		console.log("showMediaCategoriesView");
		baja.trackView("/mediacategories");
		
		if (e.view.params["i"] != null) {
			media.set("previousMediaIndex", media.get("currentMediaIndex"));
			
			// initialize loaded tracking
			var hasLoadedOnce = media.get("hasLoadedOnce");
			if (hasLoadedOnce == null) {
				hasLoadedOnce = new Array();
				for(var i=0;i < config.media.length;i++) {
					hasLoadedOnce[i] = false;
				}
				media.set("hasLoadedOnce", hasLoadedOnce);
			}
			
			var index = e.view.params["i"];
			media.set("currentMediaIndex", index);
			var mediaList = config.media[index];
			media.set("currentFeedTitle", mediaList.title);
			$("#navbar-mediacategories").data("kendoMobileNavBar").title(mediaList.title);
			
			// get data
			if (!hasLoadedOnce[index] || !mediaList.items.paged || media.get("currentMediaIndex") != media.get("previousMediaIndex")) {
				if (media.get("currentMediaIndex") != media.get("previousMediaIndex") && mediaList.items.customReset != null) {
					eval(mediaList.items.customReset);
				}
				media.loadNextItems(mediaList);
			}
			else {
				if (media.get("dsCategories").data().length == 0) {
					setTimeout(function() { app.navigate("mediafeed", "none"); }, 100);
				}
			}
		}
	},

	loadNextItems: function() {
		var mediaList = config.media[media.get("currentMediaIndex")];
		$("#btnLoadMore").remove();
		
		media.getRssFeed(mediaList, media.get("device"), function(feed) {
			hasLoadedOnce = media.get("hasLoadedOnce");
			hasLoadedOnce[media.get("currentMediaIndex")] = true;
			media.set("hasLoadedOnce", hasLoadedOnce);
		
			media.get("dsCategories").data(feed.categories);
			media.get("dsFeedAll").data(feed.items);
			if (feed.categories.length == 0) {
				media.set("currentCategory", null);
				console.log("indexes: " + media.get("currentMediaIndex") + "/" + media.get("previousMediaIndex"));
				if (mediaList.items.paged && media.get("currentMediaIndex") == media.get("previousMediaIndex")) {
					for(var i=0;i < feed.items.length;i++) {
						media.get("dsFeed").data().push(feed.items[i]);
					}
				}
				else {
					media.get("dsFeed").data(feed.items);
				}
				app.navigate("mediafeed", "none");
			}
			if (mediaList.items.paged) {
				$("#list-mediafeed").after("<button id='btnLoadMore' class='baja-button' style='display:block;width:200px;margin:10px auto;' onclick='media.loadNextItems()'>Load More</button>");
			}
		});
	},

	beforeShowMediaFeedView: function(e) {
		if (media.get("dsFeed").data().length == 1 
			&& config.media[media.get("currentMediaIndex")].neverShowOneItem != null 
			&& config.media[media.get("currentMediaIndex")].neverShowOneItem) {
	    	media.set("currentItem", media.get("dsFeed").data()[0]);
	    	e.preventDefault();
	    	app.navigate("mediaitem", "none");
	    }
	},

	initMediaFeedView: function(e) {
		console.log("initMediaFeedView - " + media.get("dsFeed").data().length + " items");
		
	},

	showMediaFeedView: function(e) {
		console.log("showMediaFeedView");
	    baja.trackView("/mediafeed");
	    
	    var mediaList = config.media[media.get("currentMediaIndex")];
		var itemTemplate = mediaList.items.template != null ? mediaList.items.template : "template-media-feed-item";
		if ($("#list-mediafeed").data("kendoMobileListView") == null || media.get("currentMediaIndex") != media.get("previousMediaIndex")) {
			if ($("#list-mediafeed").data("kendoMobileListView") != null) {
				$("#list-mediafeed").data("kendoMobileListView").destroy();
			}
			$("#list-mediafeed").kendoMobileListView({
				dataSource: media.get("dsFeed"),
				autoBind: true,
				template: $("#" + itemTemplate).html(),
				click: function(e) {
					media.set("currentItem", e.dataItem);
					app.navigate("mediaitem");
				}
			});
		}
		
	    $("#navbar-mediafeed").data("kendoMobileNavBar").title(media.get("currentFeedTitle"));
	    if (e.view.params["reset"] != null || media.get("currentMediaIndex") != media.get("previousMediaIndex")) {
	    	e.view.scroller.reset();
	    }
	    media.set("previousMediaIndex", media.get("currentMediaIndex"));
	},

	beforeMediaItemView: function(e) {
		console.log("before media item view");
		var item = media.get("currentItem");
		if (item.type == "link") {
			e.preventDefault();
			app.navigate("mediafeed", "none");
			window.open(item.link, "_blank");
		}
		
		var mediaList = config.media[media.get("currentMediaIndex")];
		if (mediaList.details != null && mediaList.details.onload != null) {
			$("#div-media-item-custom").hide();
			$("#div-media-item-view").hide();
		}
	},
	
	initMediaItemView: function(e) {
		
	},
	
	showMediaItemView: function(e) {
		baja.trackView("/mediaitem");
		console.log("show mediaItemView");
		
		var item = media.get("currentItem");
		var mediaList = config.media[media.get("currentMediaIndex")];

		$(document).one("media-detail-loaded", function(event) {
			var mediaList = event.mediaList;
			var item = event.item;
		
			$("#navbar-mediaitem").data("kendoMobileNavBar").title(media.get("currentFeedTitle"));
			if (config.media[media.get("currentMediaIndex")].neverShowOneItem) {
				media.get("currentItem").set("displayDate", "");
			}
				
			// custom template
			if (mediaList.details != null && mediaList.details.template != null) {
				$("#div-media-item-custom").show();
				$("#div-media-item-view").hide();
				var template = kendo.template($("#" + mediaList.details.template).html());
				$("#div-media-item-custom").empty().append(template(item));
			}
			else {
				$("#div-media-item-custom").hide();
				$("#div-media-item-view").show();
				if (item.thumbnail.length > 0) {
					$("img#thumb-image").attr("src", item.thumbnail);
					$("img#thumb-shadow").width($("img#thumb-image").width() + 10);
				}
				if (item.description.length > 0) {
					$("img#thumb-image").attr("src", "");
					if (item.type != "content") {
						$("#divDescription").show();
						$("#divDescription2").hide();
					}
					else {
						$("#divDescription").hide();
						$("#divDescription2").show();
					}
				}
	
				// YOUTUBE stuff
				if (item.type == "video" && item.urlVideo && item.urlVideo.indexOf("youtube.com") != -1 && baja.get("os") == "ios") {
					//$("#btnMediaWatch").css("opacity",".3").attr("disabled","disabled");
					$("#btnMediaWatch").hide();
					$("#media-button-fb").show();
					$("#media-icon-fb").hide();
					media.setupYouTubeFrame(item);
					return false;
				}
	
				// Content scraping
				if (item.type == "content" && item.content != null) {
					if (item.content.method != null && item.content.method == "scrape") {
						var url = item.urlContent;
						$("#media-item-text").empty();
						e.view.scroller.reset();
						app.showLoading();
						$.ajax({
							url: url,
							type: "GET",
							dataType: "html",
							success: function(html) {
								var stuff = $(".entry-content", html).html();
								$("#media-item-text").html(stuff);
							},
							error: function(xhr, status, error) {
								console.log(error);
							},
							complete: function() {
								app.hideLoading();
							}
						});
					}
				}
	
				// disable anchors in html
				if (item.html.length > 0) {
					$("#div-content-html a").each(function(index) {
						$(this).removeAttr("href");
					});
				}
			}
		});
		
		// custom load method
		if (mediaList.details != null && mediaList.details.onload != null) {
			eval(mediaList.details.onload);
		}
		else {
			var event = $.Event("media-detail-loaded");
			event.item = item;
			event.mediaList = mediaList;
			$(document).trigger(event);
		}
		
		if (e && e.view && e.view.scroller) {
			e.view.scroller.reset();
		}
	},
	
	setupYouTubeFrame: function(item) {
		$("iframe#ytplayer").remove();
		var url = "https://www.youtube.com/embed/{videoId}?modestbranding=1&rel=0&showinfo=0&theme=light&enablejsapi=1";
		var iframeHtml = '<iframe id="ytframe" type="text/html" frameborder="0" allowfullscreen="1"></iframe>';
		var iframe = $(iframeHtml).attr("src", url.replace("{videoId}", item.videoId));
		youtubeItem = item;
		$("#thumb-image").on("load", function() {
			setTimeout(function() {
				console.log("creating youtube iframe");
				$(this).off("load");
				media.positionIframe(iframe);
				$(".media-item-detail").append(iframe);
				ytplayer = new YT.Player("ytframe", { videoId: youtubeItem.videoId });
			}, 1000);
		});
		$("#thumb-image").attr("src", youtubeItem.thumbnail);
	},
	
	hideMediaItemView: function(e) {
		$("#divDescription").hide();
		$("#thumb-image").attr("src","");
		$("video").remove();
		$("#media-item-text").empty();
		//$("#btnMediaWatch").show();
		$("#media-button-fb").hide();
		$("#media-icon-fb").show();
		$("#ytframe").remove();
	},

	playItem: function(type, itemIndex) {
		if (itemIndex == undefined) {
			itemIndex = media.get("currentMediaIndex");
		}
		var item = media.get("currentItem");
		if (type == undefined) {
			type = config.media[itemIndex].itemType;
		}
		console.log("current media index: " + itemIndex + ", type: " + type);
		
		switch (type) {
			
			case "audio":
				var track = { Url: item.urlAudio, Title: item.title };
				audio.playTracks([ track ]);
				if (bible) {
					bible.set("playingCurrentChapter", false);
				}
				break;
				
			case "video":
				console.log(item.urlVideo);
				var mediaItem = config.media[itemIndex];
				var connection = checkConnection();
				console.log("play video feed: " + connection + " / wifi-only: " + mediaItem.wifiOnly);
				if (mediaItem.wifiOnly && connection != "wifi" && baja.get("os") == "ios") {
					console.log("wifi restriction applied.");
					var msg = "This video stream is only available when using a WIFI data connection.";
					msg += "\nYour current connection is: " + connection;
					navigator.notification.alert(msg, null, "Video Player", "OK");
					return;
				}
				else {
					if (item.urlVideo.indexOf("vimeo.com") != -1) {
						var url = item.urlVideo.replace("vimeo.com/","vimeo.com/m/");
						if (baja.get("os") == "ios") {
							window.open(url, "vimeo", "location=yes");
						}
						else {
							window.open(url, "_system", "location=yes");
						}
						return false;
					}
					if (item.urlVideo.indexOf("youtube.com") != -1) {
						console.log("calling playVideo()...");
						if (baja.get("ios") == "ios") {
							ytplayer.playVideo();
							console.log("playVideo() called.");
							e.preventDefault();
							return false;
						}
						else {
							var ytandroid = window.open(item.urlVideo, "_system");
							ytandroid.addEventListener('exit', function() { /* do something? */ })
							e.preventDefault();
							return false;
						}
					}
					if (baja.get("os") == "android") {
						window.plugins.videoPlayer.play(item.urlVideo);
					}
					else {
						app.showLoading();
						setTimeout(function() {
							app.hideLoading();
						}, 4000);
						$("video").remove();
						var player = $("<video width='320' height='240' onplaying='this.webkitEnterFullscreen();' autoplay controls></video>");
						player.attr("src", item.urlVideo);
						if (baja.get("isTablet")) {
							media.positionVideoTag(player);
							$(".media-item-detail").append(player);
						}
						else {
							if (baja.get("os") == "android") {
								$(document.body).append(player);
							}
							else {
								player.css("position", "absolute").css("left","-5000");
								$(".media-item-detail").append(player);
							}
						}
					}
				}
				break;
				
			case "live":
				var mediaItem = config.media[itemIndex];
				if (mediaItem.status != null) {
					console.log(mediaItem.status.url);
					app.showLoading();
					$.ajax({
						url: mediaItem.status.url,
						type: "GET",
						dataType: "xml",
						cache: false,
						success: function(xml) {
							console.log('success getting status feed');
							var timeRemaining = $(xml).find(mediaItem.status.remainingTime.node).text();
							if (timeRemaining.length > 0) {
								var msg = "No live event is current playing.";
								var nextEventTitle = $(xml).find(mediaItem.status.displayText.node).text();
								if (nextEventTitle != null) {
									msg += "\nThe next event is:\n\n" + nextEventTitle;
								}
								navigator.notification.alert(msg, null, "Live Player", "OK");
							}
							else {
								media.playLiveFeed(mediaItem);
							}
						},
						error: function() {
							console.log('error');
							media.playLiveFeed(mediaItem);
						},
						complete: function() {
							app.hideLoading();
						}
					});
				}
				else {
					if (mediaItem.schedule != null) {
						var nextEvent = media.findNextEvent(mediaItem.schedule.events, mediaItem.schedule.timezone);
						if (nextEvent != null) {
							var tz = getTimeZoneString();
							var msg = "No events are scheduled for now.";
							msg += "\nThe next live event is scheduled for:\n" + nextEvent.format("dddd MMM DD, hh:mm a ") + tz;
							msg += "\nYou may open the player anyway to check for an unscheduled event.";
							navigator.notification.confirm(msg, function(buttonIndex) {
								if (buttonIndex == 2) {
									media.playLiveFeed(mediaItem);
									return;
								}
								else return;
							}, "Live Player", "Close,Open Player");
							return;
						}
						else {
							console.log("event playing");
							media.playLiveFeed(mediaItem);
							return;
						}
					}
					else {
						console.log("no live feed schedule defined");
						media.playLiveFeed(mediaItem);
						return;
					}
					console.log("no live feed status check defined");
					media.playLiveFeed(mediaItem);
					return;
				}
				break;
		}
	},
	
	findNextEvent: function(events, offset) {
		var target = moment().utc().subtract("minutes", -(offset*60));
		var current = target.format("HH") + "" + target.format("mm");
		console.log(target.day() + " " + current);

		var testStart = [];
		var testEnd = [];
		var next;
		var minDiff = 900000000;
		var isShowing = false;
		for (var i=0;i < events.length;i++) {
			if (target.day() == events[i].dayOfWeek 
				&& current >= events[i].startTime.replace(":","")
				&& current <= events[i].endTime.replace(":",""))
				{
					isShowing = true;
					return null;
					break;
				}
			else {
				testStart[i] = target.clone();
				testEnd[i] = target.clone();
				testStart[i].hour(parseInt(events[i].startTime.split(":")[0]));
				testStart[i].minute(parseInt(events[i].startTime.split(":")[1]));
				testEnd[i].hour(parseInt(events[i].endTime.split(":")[0]));
				testEnd[i].minute(parseInt(events[i].endTime.split(":")[1]));
				testStart[i].day(events[i].dayOfWeek);
				testEnd[i].day(events[i].dayOfWeek);
				if (target.isAfter(testEnd[i])) {
					testStart[i].day(testStart[i].day() + 7);
					testEnd[i].day(testEnd[i].day() + 7);
				}
				var diff = testStart[i].diff(target);
				if (diff < minDiff) {
					next = testStart[i];
					minDiff = diff;
				}
				console.log(testStart[i].day() + " (" + diff  + ") : " + testStart[i].format() + " - " + testEnd[i].format());
			}
		}
		
		console.log("next: " + next.format());
		next.add("minutes", -(offset*60))
		console.log("utc: " + next.format());
		console.log("local: " + next.local().format());

		return next;
	},
	
	playLiveFeed: function(mediaItem) {
		audio.kill();
		var connection = checkConnection();
		console.log("play live feed: " + connection + " / wifi-only: " + mediaItem.wifiOnly);
		if (mediaItem.wifiOnly && connection != "wifi" && baja.get("os") == "ios") {
			var msg = "This video stream is only available when using a WIFI data connection.";
			msg += "\nYour current connection is: " + connection;
			navigator.notification.alert(msg, null, "Video Player", "OK");
		}
		else {
			if (baja.get("os") == "android") {
				var url = eval("mediaItem.url." + media.get("device"));
				window.plugins.videoPlayer.play(url);
			}
			else {
				app.showLoading();
				setTimeout(function() {
					app.hideLoading();
				}, 3000);
				$("video").remove();
				var player = $("<video width='400' height='320' onplaying='this.webkitEnterFullscreen();' autoplay controls></video>");
				if (!baja.get("isTablet")) {
					player = $("<video width='300' height='240' onplaying='this.webkitEnterFullscreen();' autoplay controls></video>");
				}
				$("#video-attach").append(player);
				var view = $("#video-player").data("kendoMobileModalView");
				view.open();
				var url = eval("mediaItem.url." + media.get("device"));
				console.log(url);
				player.attr("src", url);
			}
		}
	},

	playSpecificItem: function(ctrl) {
		var mediaListIndex = $(ctrl).attr("ref").split("|")[0];
		var mediaListItem = $(ctrl).attr("ref").split("|")[1];
		if (mediaListIndex == media.get("currentMediaIndex")) {
			media.set("currentItem", media.get("dsFeed").data()[mediaListItem]);
			app.navigate("mediaitem");
		}
		baja.setCurrentTab("#mediafeed?i=" + mediaListIndex);
	},

	loadRssFeedByIndex: function(index) {
		var mediaList = config.media[index];
		media.loadRssFeed(mediaList);
	},

	getRssFeed: function(mediaList, device, callback) {
		console.log("getRssFeed");
		var url = eval("mediaList.url." + device);
		if (mediaList.items.customUrlFormat != null) {
			url = eval(mediaList.items.customUrlFormat);
		}
		app.showLoading();
		
		$.ajaxSetup({ beforeSend: function (xhr) {  }, timeout:30000 });
		if (mediaList.authUsername != null) {
			if (baja.get("os") == "ios") {
				$.ajax({
					url: url,
					type: "GET",
					dataType: "xml",
					timeout: 30000,
					username: mediaList.authUsername,
					password: mediaList.authPassword,
					success: function(rss) {
						return media.parseFeed(mediaList, rss, device, callback);
					},
					error: function(xhr, status, error) {
						console.log(xhr);
						alert("rss feed could not be retrieved\n" + error);
						app.hideLoading();
						$.ajaxSetup({ beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", config.authString); }, timeout: moduleLoadTimeout*1000 });
					},
					complete: function() {
						app.hideLoading();
						$.ajaxSetup({ beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", config.authString); }, timeout: moduleLoadTimeout*1000 });
					}
				});
			}
			else {
				$.ajax({
					url: url,
					type: "GET",
					dataType: "xml",
					timeout: 30000,
					beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", mediaList.basicAuth); },
					success: function(rss) {
						return media.parseFeed(mediaList, rss, device, callback);
					},
					error: function(xhr, status, error) {
						console.log(xhr);
						alert("rss feed could not be retrieved\n" + error);
						app.hideLoading();
						$.ajaxSetup({ beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", config.authString); }, timeout: moduleLoadTimeout*1000 });
					},
					complete: function() {
						app.hideLoading();
						$.ajaxSetup({ beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", config.authString); }, timeout: moduleLoadTimeout*1000 });
					}
				});

			}
			return;
		}
		
		
		$.ajax({
			url: url,
			type: "GET",
			dataType: "xml",
			success: function(rss) {
				return media.parseFeed(mediaList, rss, device, callback);
			},
			error: function(xhr, status, error) {
				console.log(xhr);
				alert("rss feed could not be retrieved\n" + error);
				app.hideLoading();
				$.ajaxSetup({ beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", config.authString); }, timeout: moduleLoadTimeout*1000 });
			},
			complete: function() {
				app.hideLoading();
				$.ajaxSetup({ beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", config.authString); }, timeout: moduleLoadTimeout*1000 });
			}
		});
	},

	parseFeed: function(mediaList, rss, device, callback) {
		console.log("parseFeed");
		var items = [];
		var categories = [];
		
		// get categories
		if (mediaList.categories) {
			var index = 0;
			$(mediaList.categories.xmlpath, rss).each(function() {
				if ($.trim($(this).text()).length > 0) {
					if (mediaList.categories.method == "text") {
						categories[index] = { text: $(this).text() };
					}
					index++;
				}
			});
		}
				
		// get items
		index = 0;
		attributes = [ "id", "date", "title", "category", "author", "urlAudio", "length", "thumbnail", "description", "urlSocial", "content", "link", "html" ];
		$(mediaList.items.xmlpath, rss).each(function(index) {
			if (mediaList.maxItems != null && index > mediaList.maxItems) {
				return false;
			}
			items[index] = kendo.observable({ type: mediaList.itemType, date: new Date(), displayDate:"", title:"", category:"", author:"", urlAudio:"", urlVideo:"", length:"", thumbnail: "", description: "", urlSocial: "", content: {}, id:"", videoId:"", link:"", html:"" });
			
			// parse standard attributes
			for (var a=0;a < attributes.length; a++) {
				//console.log("looking for " + attributes[a]);
				var property = eval("mediaList.items." + attributes[a]);
				if (property) {
					switch(property.method) {
						case "find":
							node = $(this).find(property.node);
							break;
						case "child":
							node = $(this).children(property.node);
							break;
					}
					if (attributes[a] != "content") {
						if (property.attribute) {
							node = node.attr(property.attribute);
						}
						else {
							node = node.text();
						}
					}
					if (attributes[a] != "date" && attributes[a] != "content") {
						eval("items[index]." + attributes[a] + " = node");
					}
					else {
						if (attributes[a] == "date") {
							if (property.format != null) {
								eval("items[index].date = kendo.parseDate(node, property.format)");
								eval("items[index].displayDate = kendo.toString(kendo.parseDate(node, property.format), 'MMM dd, yyyy')");
							}
							else {
								eval("items[index].date = new Date(Date.parse(node))");
								eval("items[index].displayDate = kendo.toString(new Date(Date.parse(node)), 'MMM dd, yyyy')");
							}
						}
						if (attributes[a] == "content") {
							items[index].content = property;
							// get url
							items[index].urlContent = $(this).find(property.urlNode).text();
						}
					}
				}
			}

			// parse special attributes
			if (mediaList.items.urlVideo && mediaList.items.urlVideo.method == "find") {
				var nodeName = eval("mediaList.items.urlVideo.node." + device);
				var node = $(this).find(nodeName);
				if (mediaList.items.urlVideo.attribute) {
					node = node.attr(mediaList.items.urlVideo.attribute);
				}
				else {
					node = node.text();
				}
				items[index].urlVideo = node;
				// youtube special stuff
				if (items[index].urlVideo.indexOf("youtube.com") != -1  && items[index].id != "") {
					var urlParts = items[index].id.split("/");
					var videoId = urlParts[urlParts.length-1];
					items[index].thumbnail = "http://i.ytimg.com/vi/{videoId}/0.jpg".replace("{videoId}", videoId);
					items[index].videoId = videoId;
				}
			}
			
			index++;
		});
		if (mediaList.sortDirection == null || mediaList.sortDirection != "asc") {
			console.log("sorting items");
			items = items.sort(compare);
		}
		return callback({ categories: categories, items: items });
	},
	
	share: function(e) {
		var mediaItem = media.get("currentItem");
		var url = "";
		if (mediaItem.urlVideo.length > 0) {
			url = mediaItem.urlVideo;
		}
		else {
			url = mediaItem.urlAudio;
		}
		if (mediaItem.urlSocial.length > 0) {
			url = mediaItem.urlSocial;
		}
		console.log("url: " + url);
		var shareData = { item: mediaItem, url: url };
		baja.showSharePanel(e.button, "media", false, shareData);
	},
	
	shareFacebook: function() {
		var item = media.get("currentItem");
		var url = "";
		if (item.urlVideo.length > 0) {
			url = item.urlVideo;
		}
		else {
			url = item.urlAudio;
		}
		if (item.urlSocial.length > 0) {
			url = item.urlSocial;
		}
		console.log("url: " + url);
		var message = item.title + " by " + item.author;
		if ($.trim(item.description.length) > 0) message += "\n" + strip(item.description).replace(/(\r\n|\n|\r)/gm," ");
		message += "\n" + url + "\n";
		message += "\n" + config.sharing.sentByText;
		title = item.title;
		baja.postFacebook(message, url, title);
	},
	
	loading: function(e) {
		//app.hideLoading();
	},
	
	playing: function(e) {
		app.hideLoading();
	},
	
	paused: function(e) {
		app.hideLoading();
		console.log("paused");
	},
	
	ended: function(e) {
		app.hideLoading();
		console.log("ended");
	},

	getDatePart: function(date, part) {
		return kendo.toString(kendo.parseDate(date), part);
	}
});

var youtubeItem;
var ytplayer;

media.init();