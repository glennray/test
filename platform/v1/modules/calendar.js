/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

var calendar = new kendo.data.ObservableObject({
	// properties
	
	// dependent methods

	init: function() {
		console.log("calendar module initialized");
	},
	
	showEvents: function() {
		baja.trackView("/events");
		if (config.calendar && config.calendar.type == "html") {
			console.log("scraping events list from html");
			app.showLoading();
			$.ajax({
				url: config.calendar.feedUrl,
				type:"GET",
				dataType: "html",
				success: function(html) {
					var markup = html;
					calendar.parseEventsHtml(markup);
				},
				error: function() {
					console.log("ajax error");
				},
				complete: function() {
					app.hideLoading();
				}
			});
		}
		else if (config.calendar && config.calendar.type == "rss") {
			console.log("get events list from rss feed");
			app.showLoading();
			$.ajax({
				url: config.calendar.feedUrl,
				type:"GET",
				dataType: "xml",
				success: function(rss) {
					calendar.parseEventsRss(rss, function(data) {
						$("#events-html").empty();
						for(var i=0; i < data.length; i++) {
							var template = kendo.template($("#template-event").html());
							$("#events-html").append(template(data[i]));
						}
					});
				},
				error: function() {
					console.log("ajax error");
				},
				complete: function() {
					app.hideLoading();
				}
			});
		}
		else if (config.calendar && config.calendar.type == "atom") {
			console.log("get events list from  atom feed");
			app.showLoading();
			$.ajax({
				url: config.calendar.feedUrl,
				type:"GET",
				dataType: "xml",
				success: function(feed) {
					calendar.parseEventsAtom(feed, function(data) {
						$("#events-html").empty();
						for(var i=0; i < data.length; i++) {
							var template = kendo.template($("#template-event").html());
							$("#events-html").append(template(data[i]));
						}
					});
				},
				error: function() {
					console.log("ajax error");
				},
				complete: function() {
					app.hideLoading();
				}
			});
		}
		else if (config.calendar && config.calendar.type == "google") {
			console.log("get events list from Google Calendar feed");
			app.showLoading();
			var today = moment().format("YYYY-MM-DD");
			var timestamp = moment().format();
			var url = config.calendar.feedUrl.replace("{today}",today).replace("{timestamp}", timestamp);
			$.ajax({
				url: url,
				type:"GET",
				dataType: "xml",
				success: function(feed) {
					calendar.parseEventsGoogleCalendar(feed, function(data) {
						$("#events-html").empty();
						for(var i=0; i < data.length; i++) {
							var template = kendo.template($("#template-event").html());
							$("#events-html").append(template(data[i]));
						}
					});
				},
				error: function() {
					console.log("ajax error");
				},
				complete: function() {
					app.hideLoading();
				}
			});
		}
	},
	
	parseEventsRss: function(rss, callback) {
		var items = [];
		$("channel > item", rss).each(function(index, value) {
			var item = new kendo.observable({ title:"", when:"", where:"", description:"", thumbnail:"" });
			item.title = $(this).find("title").text();
			if ($(this).find("enclosure").attr("url") != undefined) {
				item.thumbnail = $(this).find("enclosure").attr("url");
			}
			var content = "";
			if ($(this).find("encoded").length > 0) {
				console.log("using encoding node");
				content = $(this).find("encoded").text();
			}
			else if ($(this).find("description").length > 0) {
				console.log("using description node");
				content = $(this).find("description").text();
			}

			var div = $("#app-element").append(content);
			div.find("a").each(function() {
				var href = $(this).attr("href");
				$(this).attr("href", "javascript:baja.loadUrl('" + href + "')");
			});
			div.find("img").each(function() {
				$(this).attr("width", "").attr("height", "").addClass("event-img");
			});
			item.description = div.html();
			div.html("");
			items[items.length] = item;
			console.log(item);
		});
		callback(items);
	},
	
	parseEventsAtom: function(feed, callback) {
		var items = [];
		$("feed > entry", feed).each(function(index, value) {
			var item = new kendo.observable({ title:"", when:"", where:"", description:"", thumbnail:"" });
			item.title = $(this).find("title").text();
			if ($(this).find("enclosure").attr("url") != undefined) {
				item.thumbnail = $(this).find("enclosure").attr("url");
			}
			var content = "";
			if ($(this).find("summary").length > 0) {
				console.log("using summary node");
				content = $(this).find("summary").text();
			}

			var div = $("#app-element").append(content);
			div.find("a").each(function() {
				var href = $(this).attr("href");
				$(this).attr("href", "javascript:baja.loadUrl('" + href + "')");
			});
			div.find("img").each(function() {
				$(this).attr("width", "").attr("height", "").addClass("event-img");
			});
			item.description = div.html();
			div.html("");
			items[items.length] = item;
			console.log(item);
		});
		callback(items);
	},
	
	parseEventsGoogleCalendar: function(feed, callback) {
		var items = [];
		$("feed > entry", feed).each(function(index, value) {
			var item = new kendo.observable({ title:"", when:"", where:"", description:"", thumbnail:"" });
			item.title = $(this).find("title").text();

			var content = "";
			if ($(this).find("content").length > 0) {
				console.log("parsing content node");
				content = $(this).find("content").text().replace(/<br \/>/gi,"~|~");
				var lines = content.split("~|~");
				for (var i=0;i<lines.length;i++) {
					if ($.trim(lines[i]).length > 0) {
						var line = $.trim(lines[i]);
						if (line.indexOf("When:") > -1) {
							var when = $.trim(line.substr(line.indexOf("When:")+5));
							if (when.indexOf(" to ") > -1) {
								item.when = when.substring(0,when.indexOf(" to "));
							}
							else {
								item.when = when;
							}
						}
						if (line.indexOf("First start:") > -1) {
							stuff = $.trim(line.substr(line.indexOf("First start:")+12));
							var m = moment.utc($.trim(stuff),"YYYY-MM-DD HH:mm:ss Z");
							item.when = m.format("dddd") + " at " + m.format("HH:mma");
							
						}
						if (line.indexOf("Where:") > -1) {
							item.where = $.trim(line.substr(line.indexOf("Where:")+6));
						}
						if (line.indexOf("Event Description:") > -1) {
							item.description = $.trim(line.substr(line.indexOf("Event Description:")+18));
						}
					}
				}
			}

			items[items.length] = item;
			console.log(item);
		});
		callback(items);
	},
	
	parseEventsHtml: function(html) {
		$("#events-html").empty();
		var content = "<div>" + html + "</div>";
		content = content.replace(/h3/gi, "div").replace(/h4/gi, "div").replace(/<p/gi, "<div").replace(/<\/p>/gi, "</div>").replace(/span/gi, "div");
		$(content).children("div.event").each(function() {
			var event = { title:"", when:"", where:"", description:"", thumbnail:"" };
			var title = $(this).find(".info div a").text();
			var when = $($(this).find(".details div").first().contents().filter(function() { return this.nodeType == 3; })[1]).text();
			var where = $($(this).find(".details div").first().contents().filter(function() { return this.nodeType == 3; })[2]).text();
			var description = $(this).find(".description").html();
			var div = $("#app-element").append(description);
			div.find("a").each(function() {
				var href = $(this).attr("href");
				$(this).attr("href", "javascript:baja.loadUrl('" + href + "')");
			});
			div.find("img").each(function() {
				if ($(this).attr("src").indexOf("/") == 0) {
					$(this).attr("src", config.calendar.imgRoot + $(this).attr("src"));
				}
			});
			event.description = div.html();
			div.html("");

			var thumb = config.calendar.imgRoot + $(this).find(".thumb a img").attr("src");
			event.title = title;
			event.when = when;
			event.where = where;
			//event.description = description;
			event.thumbnail = thumb;
			
			var template = kendo.template($("#template-event").html());
			$("#events-html").append(template(event));
		});
	}
});
calendar.init();