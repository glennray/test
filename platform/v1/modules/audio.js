/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

var audio = new kendo.data.ObservableObject({
	// properties
	currentTrackIndex: 0,
	currentTrack: null,
	media: null,
	mediaStatus: null,
	mediaTimer: null,
	duration: 0,

	// dependent methods
	isPlaying: function() {
		var player = document.getElementById("audio-player");
		return !player.paused;
	},
	isTrackUpValid: function() {
		return audio.get("currentTrackIndex") < (audio.get("dsTracks").data().length-1);
	},
	isTrackDownValid: function() {
		return audio.get("currentTrackIndex") > 0;
	},

	// datasources
	dsTracks: new kendo.data.DataSource({
		data: []
	}),

	// methods
	init: function() {
		console.log("audio module initialized");
	},

	playCurrentTrack: function() {
		var track = audio.get("dsTracks").data()[audio.get("currentTrackIndex")];
		if (track !== undefined) {
			audio.updateTrackNav();
			$("#audio-title").text(track.Title);
			if (baja.get("os") == "ios" || baja.get("os") == "web") {
				var player = document.getElementById("audio-player");
				player.setAttribute("src", track.Url);
				player.play();
			}
			else {
				if (audio.get("media") != null) {
					audio.pause();
					audio.release();
				}
				var media = new Media(track.Url, audio.androidMediaSuccess, audio.androidMediaError, audio.androidMediaStatus);
				audio.set("media", media);
				media.play();
				
				// get duration
				var counter = 0;
				var timerDur = setInterval(function() {
					counter = counter + 100;
					if (counter > 2000) {
						clearInterval(timerDur);
					}
					var dur = media.getDuration();
					if (dur > 0) {
						clearInterval(timerDur);
						console.log("duration: " + dur + " sec");
						audio.set("duration", dur);
						$("#audio-slider").attr("max", dur);
					}
			    }, 250);
			}
		}
	},

	playTracks: function(tracks) {
		if (tracks.length > 1) {
			$(".audio-button.nav").show();
		}
		else {
			$(".audio-button.nav").hide();
		}
		audio.get("dsTracks").data(tracks);
		audio.set("currentTrackIndex", 0);
		audio.showPlayer();
		audio.playCurrentTrack();
	},

	next: function() {
		if (audio.isTrackUpValid()) {
			audio.set("currentTrackIndex", audio.get("currentTrackIndex") + 1);
			audio.playCurrentTrack();
		}
		else {
			audio.stop();
		}
	},

	previous: function() {
		if (audio.isTrackDownValid()) {
			audio.set("currentTrackIndex", audio.get("currentTrackIndex") - 1);
			audio.playCurrentTrack();
		}
		else {
			audio.stop();
		}
	},

	updateTrackNav: function() {
		$("#audio-next").removeClass("visible").removeClass("hidden").addClass(audio.isTrackUpValid() ? "visible" : "hidden");
		$("#audio-previous").removeClass("visible").removeClass("hidden").addClass(audio.isTrackDownValid() ? "visible" : "hidden");
	},

	release: function() {
		if (baja.get("os") == "android") {
			var media = audio.get("media");
			try {
				media.release();
			}
			catch(error) { console.log(error); }
		}
	},
	
	stop: function() {
		if (baja.get("os") == "ios") {
			var player = document.getElementById("audio-player");
			player.pause();
			audio.closePlayer();
		}
		else {
			var media = audio.get("media");
			try {
				media.stop();
			}
			catch(error) { console.log(error); }
			audio.closePlayer();
		}
	},

	pause: function() {
		if (baja.get("os") == "android") {
			var media = audio.get("media");
			try {
				media.pause();
			}
			catch(error) { console.log(error); }
		}
	},

	play: function() {
		if (baja.get("os") == "ios") {
			var player = document.getElementById("audio-player");
			if (player.src !== null) {
				player.play();
			}
			else {
				audio.playCurrentTrack();
			}
		}
		else {
			var media = audio.get("media");
			if (media != null) {
				try {
					media.play();
				}
				catch(error) { console.log(error); }
			}
			else {
				audio.playCurrentTrack();
			}
		}
	},

	kill: function() {
		audio.stop();
		$("#audio-player").attr("src", "").remove();
		var newPlayer = $("<audio id='audio-player' controls='controls' style='width:100%;' onended='audio.next()'></audio>");
		$("#audiomenu").append(newPlayer);
	},
	
	showPlayer: function() {
		$("#bible-toolbar-bottom").addClass("nudged");
		$("#audiomenu").css("bottom","50px").css("opacity", ".85");
	},

	closePlayer: function() {
		$("#audiomenu").css("opacity", "0");
		$("#bible-toolbar-bottom").removeClass("nudged");
		setTimeout(function() {
			$("#audiomenu").css("bottom","5000px");
		}, 500);
	},
	
	setTrackPosition: function(ctrl) {
		var position = $(ctrl).val();
		var media = audio.get("media");
		try {
			media.seekTo(position*1000);
		}
		catch(error) { console.log(error); }
	},
	
	androidMediaSuccess: function() {
		console.log("android media success");
	},
	
	androidMediaStatus: function(state) {
		mediaStates = {};
		mediaStates[0] = "None";
		mediaStates[1] = "Starting";
		mediaStates[2] = "Running";
		mediaStates[3] = "Paused";
		mediaStates[4] = "Stopped";
		console.log("android media status: " + mediaStates[state]);
		audio.set("mediaStatus", state);
		switch (state) {
			case 0:
				$("#btnAudioLoad").hide();
				$("#btnAudioPlay").hide();
				$("#btnAudioPause").hide();
				$("#audio-slider").hide();
				$("#audio-time").hide();
				var timer = audio.get("mediaTimer");
				if (timer != null) {
					clearInterval(timer);
				}
				$("#audio-slider").val(0);
				break;
			case 1:
				$("#btnAudioLoad").show();
				$("#btnAudioPlay").hide();
				$("#btnAudioPause").hide();
				$("#audio-slider").hide().val(0);
				$("#audio-time").hide();
				var timer = audio.get("mediaTimer");
				if (timer != null) {
					clearInterval(timer);
				}
				break;
			case 2:
				$("#btnAudioLoad").hide();
				$("#btnAudioPlay").hide();
				$("#btnAudioPause").show();
				$("#audio-slider").show();
				$("#audio-time").show();
				var media = audio.get("media");
				var timer = setInterval(function() {
					media.getCurrentPosition(
						// success callback
						function(position) {
							if (position > -1) {
								var duration = audio.get("duration");
								if (duration > 0) {
									$("#audio-slider").val(position);
									var display = secondsAsTime(position) + "/" + secondsAsTime(duration);
									$("#audio-time").text(display);
								}
							}
						},
						// error callback
						function(e) {
							console.log("Error getting pos=" + e);
						}
					);
				},100);
				audio.set("mediaTimer", timer);
				break;
			case 3:
				$("#btnAudioLoad").hide();
				$("#btnAudioPlay").show();
				$("#btnAudioPause").hide();
				$("#audio-slider").show();
				$("#audio-time").show();
				var timer = audio.get("mediaTimer");
				if (timer != null) {
					clearInterval(timer);
				}
				break;
			case 4:
				$("#btnAudioLoad").hide();
				$("#btnAudioPlay").show();
				$("#btnAudioPause").hide();
				$("#audio-slider").hide();
				$("#audio-time").hide();
				var timer = audio.get("mediaTimer");
				if (timer != null) {
					clearInterval(timer);
				}
				break;
		}
	},
	
	androidMediaError: function(error) {
		console.log("android media error: " + error);
	}
});
audio.init();