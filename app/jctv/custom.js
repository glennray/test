var jctvOnDemandBitrate = [ 300, 600, 900, 1200 ];
var jctvOnDemandQualityLabels = [ "Low", "Medium", "High", "Super" ];

var ooyalaOptions = {
	apiKey: "pzMW46NMqRipYKP6zejxIjdrEp_c.wZSkQ",
	secret: "cKklMZyqXZouYspYU885WXLy3eIgvQqir2MAnaan",
	pCode: "pzMW46NMqRipYKP6zejxIjdrEp_c",
	domain: "itbn.org"
}
var jctvSettingsAltered = false;
var custom = new kendo.data.ObservableObject({
	// properties
	customData: null,
	currentOffset: 1,
	episodeOffset: 1,
	currentItem: null,
	currentEmbedCode: null,
	currentQuality: 2,
	
	// datasources
	dsEpisodes: new kendo.data.DataSource({
		data: []
	}),
	
	// dependent methods

	// methods
	init: function() {
		if (config.customBehavior != null) {
			custom.set("customData", config.customBehavior.data);
		}
		window.console && console.log("custom module initialized");
		
		$(document).bind("app-init", function(e) {
			custom.initSettings();
		});
	},
	
	initSettings: function() {
		if (localStorage.getObject("jctvVideoQuality") != null) {
			custom.set("currentQuality", localStorage.getObject("jctvVideoQuality"));
		}
		var html = "<div class=\"list-section\">Video Options</div>";
		html += "<ul data-role=\"listview\" data-style=\"inset\"><li>";
		html += "<a id=\"jctv-quality-link\" href=\"#jctv-settings-video-quality\" class=\"settings-value\">Medium</a>";
		html += "</li></ul>";
		$("#divSettings").prepend(html);
		$("#jctv-quality-link").text(jctvOnDemandQualityLabels[custom.get("currentQuality")]);
		$(document).bind("app-settings-init", function(e) {
			if (!jctvSettingsAltered) {
				$("#jctv-quality-link").before("<span class='settings-label'>Playback Quality</span>");
				jctvSettingsAltered = true;
			}
		});
	},
	
	initWidget: function() {
		console.log("initializing custom widget");
		custom.updateLiveFeed();
	},

	updateLiveFeed: function() {
		var url = "http://www.jctv.org/includes/flashcurrent.php";
		$.ajax({
			url: url,
			type: "GET",
			dataType: "text",
			success: function(data) {
				var feedData = {nextProgramTime: [], nextProgramName: []};
				var lines = data.split("&");
				for(var i = 0;i < lines.length; i++) {
					var parts = lines[i].split("=");
					if (parts[0] == "current_prog") {
						feedData.title = parts[1];
					}
					if (parts[0] == "prog_image") {
						feedData.image = "http://www.jctv.org/images/flashprograms/" + parts[1];
					}
					if (parts[0] == "prog_id") {
						feedData.programId = parts[1];
					}
					if (parts[0].substr(0,6) == "nextt_") {
						var timeIndex = parseInt(parts[0].split("_")[1]);
						feedData.nextProgramTime[feedData.nextProgramTime.length] = parts[1];
					}
					if (parts[0].substr(0,6) == "nextp_") {
						var nameIndex = parseInt(parts[0].split("_")[1]);
						var tag = lines[i].substring(lines[i].indexOf("=")+1);
						feedData.nextProgramName[feedData.nextProgramName.length] = strip(tag);
					}
					if (parts[0] == "short_desc") {
						feedData.description = parts[1];
					}
				}
				custom.loadLiveFeed(feedData);
				setTimeout(function() { custom.updateLiveFeed(); }, 60000);
			}
		});
	},
	
 	loadLiveFeed: function(data) {
		if (data.title != null) {
			$("#feedTitle").text(data.title);
		}
		if (data.image != null) {
			$("#feedImage").attr("src", data.image);
		}
		if (data.description != null) {
			$("#feedDesc").text(data.description);
		}
		if (data.nextProgramName.length > 0 && data.nextProgramTime.length > 0) {
			var upNext = "Coming Up Next: ";
			for(var i=0; i < data.nextProgramTime.length; i++) {
				upNext += "<span>" + data.nextProgramTime[i] + " - " + data.nextProgramName[i] + "</span>";
				if (i == 0) break;
			}
			$("#feedUpNext").html(upNext);
		}
		if (baja.get("isTablet")) {
			$("#divJctvLiveFeed").addClass("tablet");
		}
	},
	
	playLiveFeed: function() {
		if (baja.get("os") == "ios") {
			if (baja.get("isTablet")) {
				window.open(custom.get("customData").liveFeedUrl, "_blank", "location=no");
				return;
			}
			$("#jctvLivePlayer").remove();
			var tag = "<video id=\"jctvLivePlayer\" style=\"position:absolute;left:-300;top:-240;width:300px;height:340px;\" autoplay></video>";
		
			$("#divJctvLiveFeed").after(tag);
			$("#jctvLivePlayer").attr("src", custom.get("customData").liveFeedUrl);
		}
		else {
			window.plugins.videoPlayer.play(custom.get("customData").liveFeedUrl);
		}
	},
	
	applyUrlParameters: function(urlType, url, data) {
		switch (urlType) {
			case "vod":
				var returnUrl = kendo.format(url, data.category, config.customBehavior.data.itemsPerPage, custom.get("currentOffset"));
				custom.set("currentOffset", custom.get("currentOffset") + config.customBehavior.data.itemsPerPage);
				return returnUrl;
				break;
		}
	},
	
	onReset: function() {
		custom.set("currentOffset", 1);
	},
	
	onDetailLoad: function(mediaList, item) {
		console.log("onDetailLoad");

		// make a trip to the api to get more detailed video info
		$.ajax({
			url: "http://www.itbn.org/api/v1.0/videos/" + item.id + "?format=json",
			type: "GET",
			dataType: "json",
			username: mediaList.authUsername,
			password: mediaList.authPassword,
			beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", mediaList.basicAuth); },
			success: function(data) {
				item.content = data.video.longDescription;
				item.urlSocial = kendo.format(custom.get("customData").socialUrl, item.id);
				item.labels = data.video.labels;
				
				// get current series category
				var category = 170;// jctv 
				for(var i=0;i < item.labels.length; i++) {
					if (item.labels[i].term.toLowerCase().indexOf("/series/") > -1) {
						category = item.labels[i].id;
						break; 
					}
				}
				item.category = category;
				
				// trigger details view rendering
				var event = $.Event("media-detail-loaded");
				event.item = item;
				event.mediaList = mediaList;
				$(document).trigger(event);
				
				// init custom video player
				if (baja.get("os") == "ios") {
					var jsUrl = config.customBehavior.data.jctvPlayerScript.replace("{ec}", item.id);
					jsUrl = jsUrl.replace("{width}", 200);
					jsUrl = jsUrl.replace("{height}", 150);
					jsUrl = jsUrl.replace("{container}", "jctvVideoPlayer");
					console.log(jsUrl); 
					$.getScript(jsUrl);
					$("#imgVideoLoader").show();
					$("#imgVideoPlay").hide();
				}
				else {
					$("#imgVideoLoader").hide();
					$("#imgVideoPlay").show();
					$("#jctv-detail-thumb, #imgVideoPlay").data("id", item.id).bind("click", function() {
						custom.playVideoAndroid($(this).data("id"));
					});
				}

				// finish the UI
				custom.set("currentItem", item);
				custom.set("episodeOffset", 1);
				custom.get("dsEpisodes").data([]);
				$("#jctv-list-episodes").kendoMobileListView({
					dataSource: custom.get("dsEpisodes"),
					autoBind: true,
					template: $("#template-jctv-video-item").html(),
					click: function(ev) {
						console.log(ev.dataItem);
						try {
							media.set("currentItem", ev.dataItem);
						}
						catch(ex) {
							console.log(ex.message);
						}
						// cleanup and force view reload
						$("#jctv-list-episodes").data("kendoMobileListView").destroy();
						$("#div-media-item-custom").empty();
						media.showMediaItemView({ view: app.view() });
					}
				});
				custom.loadNextEpisodes();
			}
		});
	},
	
	loadNextEpisodes: function() {
		var mediaList = config.media[media.get("currentMediaIndex")];
		var item = custom.get("currentItem");
		var url = "http://www.itbn.org/api/v1.0/videos/category/{0}/sortby/airdate/sort/desc/limit/{1}/offset/{2}?format=json";
		$("#btnLoadMoreEpisodes").remove();
		 
		app.showLoading();
		$.ajax({
			url: kendo.format(url, item.category, custom.get("customData").itemsPerPage, custom.get("episodeOffset")),
			type: "GET",
			dataType: "json",
			username: mediaList.authUsername,
			password: mediaList.authPassword,
			beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", mediaList.basicAuth); },
			success: function(data) {
				var newOffset = custom.get("episodeOffset") + custom.get("customData").itemsPerPage;
				custom.set("episodeOffset", newOffset);
				for (var i=0;i < data.videos.length;i++) {
					if (data.videos[i].embedCode == item.id) continue;
					var airDate = kendo.parseDate(data.videos[i].airDate, mediaList.items.date.format);
					var video = kendo.observable({
						id: data.videos[i].embedCode,
						thumbnail: data.videos[i].thumbnailUrl,
						title: data.videos[i].displayTitle,
						description: data.videos[i].description,
						date: airDate,
						displayDate: kendo.toString(airDate, "MMM dd, yyyy")
					});
					custom.get("dsEpisodes").data().push(video);
				}
				$("#jctv-list-episodes").after("<button id='btnLoadMoreEpisodes' class='baja-button' style='display:block;width:200px;margin:10px auto;' onclick='custom.loadNextEpisodes()'>Load More</button>");
			},
			complete: function() { app.hideLoading(); }
		});
	},
	
	playVideoAndroid: function(embedCode) {
		custom.set("currentEmbedCode", embedCode);
		if (localStorage.getObject("jctvVideoQuality") == null) {
			var dialog = $("#jctv-video-quality").data("kendoMobileModalView");
			dialog.open();
		}
		else {
			var url = "http://player.ooyala.com/sas/player_api/v1/authorization/embed_code/{pcode}/{embedcode}?api_key={apikey}&device=android_sdk&domain={domain}";
			url = url.replace("{pcode}", ooyalaOptions.pCode).replace("{embedcode}", embedCode).replace("{apikey}", ooyalaOptions.apiKey).replace("{domain}", ooyalaOptions.domain);
			$.ajax({
				url: url,
				type: "GET",
				dataType: "json",
				success: function(data) {
					var aryStreams = data.authorization_data[embedCode].streams;
					var selectedStream = aryStreams[0];
					for(var i=0; i < aryStreams.length; i++) {
						if (aryStreams[i].video_bitrate == jctvOnDemandBitrate[custom.get("currentQuality")]) {
							selectedStream = aryStreams[i];
							break;
						}
					}
					var streamUrl = window.atob(selectedStream.url.data);
					console.log("***** playing stream: " + streamUrl);
					window.plugins.videoPlayer.play(streamUrl);
				}
			});
        }
	},
	
	showQualitySettings: function(e) {
		$("#jctv-list-quality [ref='" + custom.get("currentQuality") + "']").addClass("selected");
	},
	
	saveSettings: function(setting, value, ctrl) {
		custom.set("currentQuality", value);
		localStorage.setObject("jctvVideoQuality", value);
		app.navigate("#:back");
		$("#jctv-list-quality li").removeClass("selected");
		$("#jctv-quality-link").text(jctvOnDemandQualityLabels[value]);
	},
	
	saveSettingsFirst: function(setting, value, ctrl) {
		custom.set("currentQuality", value);
		localStorage.setObject("jctvVideoQuality", value);
		var dialog = $("#jctv-video-quality").data("kendoMobileModalView");
		dialog.close();
		custom.playVideoAndroid(custom.get("currentEmbedCode"));
	}
});

custom.init();