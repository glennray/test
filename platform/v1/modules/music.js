/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

var music = new kendo.data.ObservableObject({
	// properties
	currentItem: null,
	feed: null,
	dsCollections: new kendo.data.DataSource({ data: []	}),	
	dsTracks: new kendo.data.DataSource({ data: [] }),
	
	// dependent methods
	musicTitle: function() {
		return config.music.title;
	},
	collectionsTitle: function() {
		return config.music.collectionsTitle;
	},
	releaseDate: function() {
		if (music.get("currentItem") != null  & music.get("currentItem").get("releaseDate") != null) {
			return "Released " + kendo.toString(kendo.parseDate(music.get("currentItem").get("releaseDate")), "MMM dd, yyyy");
		}
	},

	
	// functions
	init: function() {
		music.initEvents();
		$(document).live("app-init", function(e) {
			if (config.music != null) {
				var feed = eval("config.music.feeds." + baja.get("os"));
				music.set("feed", feed);
			}
		});
		console.log("music module initialized");
	},
	
	
	initEvents: function() {
		$(".music-collection").live("click", function(e) {
			music.selectCollection($(this).attr("index"));
		});
		
		$(".itunes-button").live("click", function(e) {
			baja.trackEvent("user", "itunes-click", "User clicked the iTunes button", 0);
			var url = $(this).attr("ref");
			console.log(url);
			window.open(url, "_system");
		});
	},
	
	
initCollections: function(e) {
		console.log("initCollections");
		
		var feed = music.get("feed");
		
		if (feed != null && feed.type != null) {
			
			switch(feed.type) {
				
				case "itunes":
					
					music.loadItunesCollections(feed, function(items) {
						music.get("dsCollections").data(items);
						$("#div-music-collections").empty();
						var html = "";
						
						for(var i=0;i < items.length;i++) {
							
							html += "<div class='music-collection' index='" + i + "'><img src='" + items[i].image + "'/><span>" + items[i].title + "</span></div>";
						}
						$("#div-music-collections").append(html);
					
					});
					
					break;
					
				case "amazon":
					music.loadAmazonAlbumData(feed, function(items) {
						music.get("dsCollections").data(items);
						$("#div-music-collections").empty();
						var html = "";
						for(var i=0;i < items.length;i++) {
							html += "<div class='music-collection' index='" + i + "'><img src='" + items[i].image + "'/><span>" + items[i].title + "</span></div>";
						}
						$("#div-music-collections").append(html);
					});
					break;
			
			}
		
		}
	
	},

	
	selectCollection: function(index) {
		var item = music.get("dsCollections").data()[index];
		music.set("currentItem", item);
		app.navigate("#music-tracks");
	},
	
	initTracks: function(e) {
		$("#list-music-tracks").kendoMobileListView({
			dataSource: music.get("dsTracks"),
			autoBind: true,
			template: $("#template-music-track").html(),
			click: function(e) {
				var tracks = [{ Url: e.dataItem.previewUrl, Title:e.dataItem.trackName }];
				audio.playTracks(tracks);
				$(".playing-track").removeClass("playing-track");
				e.item.addClass("playing-track");
			}
		});
	},
	
	showTracks: function(e) {
		baja.trackView("/music-tracks");
		var feed = music.get("feed");
		if (feed != null && feed.type != null) {
			switch(feed.type) {
				case "itunes":
					var collection = music.get("currentItem");
					music.loadItunesTracks(feed, collection, function(tracks) {
						music.get("dsTracks").data(tracks);
					});
					break;
				
				case "amazon":
					var tracks = music.get("currentItem").tracks;
					music.get("dsTracks").data(tracks);
					break;
			}
		}
	},
	
	loadItunesTracks: function(feed, collection, callback) {
		var url = feed.urlTracks.replace("{collectionId}", collection.id);
		if (baja.get("deviceCountry") != null && baja.get("deviceCountry").length > 0) {
			url = url.replace("/lookup?", "/" + baja.get("deviceCountry") + "/lookup?");
		}
		console.log(url);
		$.ajax({
			url: url,
			type: "GET",
			dataType: "json",
			success: function(data) {
				var items = [];
				for(var i=1; i < data.results.length; i++) {
					var item = kendo.observable({ trackId:"", trackName:"", url:"", previewUrl:"", trackNumber:0 });
					item.trackId = data.results[i].trackId;
					item.trackName = data.results[i].trackCensoredName;
					item.url = data.results[i].trackViewUrl;
					item.previewUrl = data.results[i].previewUrl;
					item.trackNumber = data.results[i].trackNumber;
					items.push(item);
				}
				console.log(items.length + " items found");
				return callback(items);
			},
			error: function(xhr, status, errorThrown) {
				console.log(errorThrown);
				alert("error getting iTunes feed:\n" + errorThrown);
			},
			complete: function() {
				
			}
		});
	},
	
	loadAmazonAlbumData: function(feed, callback) {
		var url = feed.urlCollections;
		$.ajax({
			url: url,
			type: "GET",
			dataType: "json",
			success: function(data) {
				var items = [];
				for(var i=0;i < data.length;i++) {
					data[i].image = data[i].imageLarge;
					data[i].imageLarge = data[i].imageHuge;
					if (data[i].tracks.length > 2) {
						items[items.length] = data[i];
					}
				}
				return callback(items);
			},
			error: function(xhr, status, errorThrown) {
				console.log(errorThrown);
				alert("error getting iTunes feed:\n" + errorThrown);
			},
			complete: function() {
				
			}
		});
	},
	

	loadItunesCollections: function(feed, callback) {
		
		var url = feed.urlCollections.replace("{artistId}", config.music.artistId);
	
		if (baja.get("deviceCountry") != null && baja.get("deviceCountry").length > 0) {
			url = url.replace("/lookup?", "/" + baja.get("deviceCountry") + "/lookup?");
		}	
		$.ajax({
			
			url: url,
			
			type: "GET",
			
			dataType: "json",
			
			success: function(data) {
				
				// itunes collections begin at item 1 (item 0 is artist element)
				
				var items = [];
				
				for(var i=1;i < data.results.length; i++) {
					
					var item = kendo.observable({ title:"", image:"", imageLarge: "", imageHuge: "", releaseDate:"", id:"", url:"", copyright:"" });
					item.title = data.results[i].collectionName;
					item.image = data.results[i].artworkUrl100;
					item.imageLarge = data.results[i].artworkUrl100.replace("100x100", "170x170");
					item.imageHuge = data.results[i].artworkUrl100.replace("100x100", "600x600");
					if (baja.get("isTablet")) {
						item.image = item.imageLarge;
						item.imageLarge = item.imageHuge;
					}
					item.releaseDate = data.results[i].releaseDate;
					item.id = data.results[i].collectionId;
					item.url = data.results[i].collectionViewUrl;
					item.copyright = data.results[i].copyright;
					items.push(item);
				}
				console.log(items.length + " items found");
				items.sort(sort_by('releaseDate', false, function(a){return a.toUpperCase()}));
				return callback(items);
			
			},
			
			error: function(xhr, status, errorThrown) {
				
				console.log(errorThrown);
				
				alert("error getting iTunes feed:\n" + errorThrown);
			
			},
			
			complete: function() {
				
			
			}

		});
	
	},
	
	
	
	showCollections: function(e) {
		
		baja.trackView("/music-collections");
	
	},
	
	share: function(e) {
		var item = music.get("currentItem");
		var url = item.url;
		var shareData = { item: item, url: url };
		console.log(shareData);
		baja.showSharePanel(e.button, "music", false, shareData);
	},
	
	shareFacebook: function() {
		var item = music.get("currentItem");
		var url = item.url;
		console.log("url: " + url);
		var message = item.title;
		message += "\n" + url + "\n";
		message += "\n" + config.sharing.sentByText;
		title = item.title;
		baja.postFacebook(message, url, title);
	}
	

});


music.init();