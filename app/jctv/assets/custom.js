var custom = new kendo.data.ObservableObject({
	// properties
	
	// dependent methods

	init: function() {
		window.console && console.log("custom module initialized");
	},
	
	initWidget: function() {
		console.log("initializing custom widget");
	
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
			var upNext = "<strong>Up Next:</strong><br/>";
			for(var i=0; i < data.nextProgramTime.length; i++) {
				upNext += "<li style=\"margin-left:5px;\">" + data.nextProgramTime[i] + " - " + data.nextProgramName[i] + "</li>";
				if (i == 1) break;
			}
			$("#feedUpNext").html(upNext);
		}
	},
	
	playLiveFeed: function() {
		location.href = config.customBehavior.data.liveFeedUrl;
	}
});

custom.init();