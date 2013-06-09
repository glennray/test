/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

if (forceWebMode == undefined) {
	var forceWebMode = false;
}
var baja = new kendo.data.ObservableObject({
	menuOpen: false,
	isTablet: kendo.support.mobileOS && kendo.support.mobileOS.tablet,
	os: kendo.support.mobileOS.name,
	user: null,
	regUsernameValid: false,
	regEmailValid: false,
	regPasswordValid: false,
	regPassword2Valid: false,
	fbConnected: false,
	shareContext: "",
	shareData: null,
	modalOpen: false,
	kendoTransition: "slide",
	deviceCountry: "",
	currentLocation: null,

	init: function() {
		if (config.locations != null && config.locations.length > 0) {
			if (localStorage.getObject("currentLocation") != null) {
				baja.set("currentLocation", localStorage.getObject("currentLocation"));
			}
		}
		config.appHttpRoot = resourceUrl + "app/" + clientId;
		config.platformHttpRoot = resourceUrl + "platform/v1";
		if (localStorage.getObject("runOnce") == null) {
            localStorage.setObject("user", null);
            localStorage.setObject("runOnce", 1);
        }
		window.console && console.log("baja.init");
		if(baja.get("os") == undefined || (forceWebMode != null && forceWebMode == true)) {
			baja.set("os", "web");
		}
		
		if (baja.get("os") != "web") {
			navigator.globalization.getLocaleName(
				function (locale) { 
					if (locale.value.split("_").length == 2) {
						baja.set("deviceCountry", locale.value.split("_")[1]);
						window.console && console.log("COUNTRY: " + baja.get("deviceCountry"));
					}
				},
				function () { window.console && console.log('Error getting locale\n'); }
			);
		}
		
		if (kendo.support.screenWidth == 768 || kendo.support.screenWidth == 1024) {
			baja.set("isTablet", true);
			kendo.support.mobileOS.tablet = true;
			kendo.support.mobileOS.device = "ipad";
		}
		appElement = document.body;

		// platform-specific settings
		if (baja.get("os") == "ios") {
			config.css = config.ios.css;
			config.tabletCss = config.ios.tabletCss;
			config.views = config.ios.views;
			config.tabletViews = config.ios.tabletViews;
			config.kendoTransition = config.ios.transition;
		}
		else {
			config.css = config.android.css;
    		config.tabletCss = config.android.tabletCss;
			config.views = config.android.views;
			config.tabletViews = config.android.tabletViews;
			config.kendoTransition = config.android.transition;
		}

		// set default ajax config
		$.ajaxSetup({ beforeSend: function (xhr) { xhr.setRequestHeader("Authorization", config.authString); }, timeout: moduleLoadTimeout*1000 });


		// load css if not web
		if (baja.get("os") != "web") {
			var getFreshCss = false;
			if (baja.get("isTablet")) {
				config.css = config.tabletCss;
			}
			window.console && console.log("css version: " + config.css.version);
			if (localStorage.getObject("style.css") == null || localStorage.getObject("css.version") == null) {
				getFreshCss = true;
			}
			else if (localStorage.getObject("css.version") < config.css.version) {
				getFreshCss = true;
			}
			if ((getFreshCss || forceUpdate) && online) {
				window.console && console.log(config.resourcePath + config.css.url);
				$.ajax({
				   url: config.resourcePath + config.css.url,
				   type: "GET",
				   dataType: "html",
				   async: false,
				   cache: false,
				   success: function(content) {
					   var stylesheet = $("<style></style>").append(content);
					   $("head").append(stylesheet);
					   localStorage.setObject("style.css", content);
					   localStorage.setObject("css.version", config.css.version);
					   window.console && console.log("css loaded remotely");
				   }
			   });
			}
			else {
				if (localStorage.getObject("style.css") != null) {
					var content = localStorage.getObject("style.css");
					var stylesheet = $("<style></style>").append(content);
					$("head").append(stylesheet);
					window.console && console.log("css loaded from cache");
				}
				else {
					var css = $("<link rel='stylesheet' href='style.css'/>");
					$("head").append(css);
					window.console && console.log("css loaded from compiled version");
				}
			}
		
			// load views
			var getFreshViews = false;
			if (baja.get("isTablet")) {
				config.views = config.tabletViews;
			}
			window.console && console.log("views version: " + config.views.version);
			if (localStorage.getObject("views.html") == null || localStorage.getObject("views.version") == null) {
				getFreshViews = true;
			}
			else if (localStorage.getObject("views.version") < config.views.version) {
				getFreshViews = true;
			}
			if ((getFreshViews || forceUpdate) && online) {
				window.console && console.log(config.resourcePath + config.views.url);
				$.ajax({
					url: config.resourcePath + config.views.url,
					type: "GET",
					dataType: "html",
					async: false,
					cache: false,
					success: function(content) {
						$(appElement).append(content);
						localStorage.setObject("views.html", content);
						localStorage.setObject("views.version", config.views.version);
						window.console && console.log("views loaded remotely");
					}
				});
			}
			else {
				if (localStorage.getObject("views.html") != null) {
					var content = localStorage.getObject("views.html");
					$(appElement).append(content);
					window.console && console.log("views loaded from cache");
				}
				else {
					$.ajax({
						url: "views.html",
						type: "GET",
						dataType: "html",
						async: false,
						cache: false,
						success: function(content) {
							$(appElement).append(content);
							localStorage.setObject("views.html", content);
							localStorage.setObject("views.version", config.views.version);
							window.console && console.log("views loaded from compiled version");
						}
					});
				}
			}
		}
		else {
			$.ajax({
				url: "web.html",
				type: "GET",
				dataType: "html",
				async: false,
				cache: false,
				success: function(content) {
					$(appElement).append(content);
				}
			});
		}
		
		if (config.customBehavior != null) {
			$.ajax({
				url: config.customBehavior.templates,
				type: "GET",
				dataType: "html",
				async: false,
				cache: false,
				success: function(content) {
					$(appElement).append(content);
				}
			});
		}
		
		// determine default tab
		var tabNames = [];
		var initialTabIndex = 0;
		for (var i=0; i < config.tabs.length; i++) {
			if (config.tabs[i].defaultTab) {
				initialTabIndex = i;
				break;
			}
		}
		var initialTab = config.tabs[initialTabIndex].view;
		

		// build tabs
		for (var i=0; i < config.tabs.length; i++) {
			var t = config.tabs[i];
			var tab = $("<a data-transition=\"none\" data-index=\"" + i + "\" data-glyph-tab=\"" + t.icon + "\" href=\"#" + t.view + "\"></a>");
			if (t.click !== undefined) {
				tab.attr("data-click", t.click);
			}
			tab.bind("touchend", function() {
				if ($(this).attr("data-click") != null) {
					eval($(this).attr("data-click"));
				}
			});
			$("#custom-tabstrip").append(tab);
		}
		window.console && console.log("tabs initialized");

		if (config.loginAll) {
			baja.authenticateUser(function(user) {
				if (user == null) {
					window.console && console.log("front login required");
					initialTab = "front-login";
				}
			});
		}
				
		// initialize kendo app
		app = new kendo.mobile.Application(appElement, {
			transition: config.kendoTransition,
			initial: initialTab,
			layout: "main",
			platform: "ios",
			majorVersion: 6,
			loading: "<h1 class='loading-message'>Loading...</h1>"
		});
		window.console && console.log("kendo initialized");

		// setup default app event handlers
		baja.initEvents();

		// do device/os specific tweaks
		if ((kendo.support.mobileOS.name == "ios" && kendo.support.mobileOS.majorVersion == 6)) {
			$("#menu-footer").show();
			$("#menu-share-bottom").hide();
			$("#menu .scroll").css("height", $("#menu .scroll").height() - $("#menu-footer").height() - 15);
		}
		else {
			$("#menu-footer").hide();
			$("#menu-share-bottom").show();
		}

		// attempt to login previous user
		baja.authenticateUser(function(user) {
			if (user != null) {
				window.console && console.log("authed user " + user);
				baja.set("user", user);
				baja.onUserLoggedIn();
			}
			else {
				window.console && console.log("no authed user");
				baja.onUserLoggedOut();
				if (baja.get("os") == "web") {
					baja.showSignIn(true);
				}
			}
			var event = $.Event("app-init");
			event.user = user;
			window.console && console.log("triggering app-init event");
			$(document).trigger(event);
			
		});

	},

	initEvents: function() {
		document.addEventListener("pause", function() {
		}, false);

		document.addEventListener("resume", function() {
		}, false);
		
		window.onorientationchange = function()
		{
			var event = $.Event("orientation-change");
			$(document).trigger(event);
			if ($(".km-popup-wrapper").length > 0) {
				var top = $($(".km-popup-wrapper")[0]).offset().top;
				$($(".km-popup-wrapper")[0]).css("top", top);
			}
			$(".km-pages,#div-home-buttons").hide();
			setTimeout(function() { $(".km-pages,#div-home-buttons").show(); }, 100);
		};
		
		$(window).resize(function() {
			var event = $.Event("orientation-change");
			$(document).trigger(event);
		});
		
		// android keyboard hack
		if (kendo.support.mobileOS.name == "android") {
			document.addEventListener("showkeyboard", function() {
				var view = app.view().id.replace(/#/,"");
				if (view == "journal-entry-edit") {
					journal.set("editHeight", $(this).height());
        			$("#entry-edit-div").css("height", "160px");
				}
			}, false);
			document.addEventListener("hidekeyboard", function() {
				var view = app.view().id.replace(/#/,"");
				if (view == "journal-entry-edit") {
					$("#entry-edit-div").height(journal.get("editHeight"));
				}
			}, false);
		}
		
		if (kendo.support.mobileOS.name == "android") {
			document.addEventListener("menubutton", baja.toggleMenu, false);
			document.addEventListener("backbutton", baja.handleBackButton, false);
		}

		$(".clickme, #menu ul li a").live("touchstart", function() {
    		$(this).addClass("pressed");
		});
		$(".clickme, #menu ul li a").live("touchend", function() {
			$(this).removeClass("pressed");
		});

		$("input.error").live("focus", function() {
			baja.showErrorTip($(this));
		});
		$("input.error").live("blur", function() {
			baja.hideErrorTip($(this));
		});
		$("input.error").live("keyup", function() {
			baja.hideErrorTip($(this));
		});

		$("#menu ul li a").live("click", function(e) {
			baja.toggleMenu();
		});

		$(".button-external-url").live("click", function() {
			var url = "config.menu.url" + $(this).attr("data-url");
			if (kendo.support.mobileOS.name == "android" || baja.get("os") == "web") {
				window.open(eval(url), '_blank', 'location=yes');
			}
			else {
				if (window.plugins.childBrowser != null) {
					cordova.exec('ChildBrowserCommand.showWebPage', eval(url));
				}
				else {
					window.open(eval(url), '_blank', 'location=yes');
				}
			}
		});

		$(document).live("user-login", function(event) {
			if (config.loginAll) {
				app.navigate("#home", "none");
			}
			if (baja.get("os") == "web") {
				var appId = "bajaweb";
				if (event.user.AppId != null && event.user.AppId.length > 0) {
					appId = event.user.AppId
					readConfig("https://dashboard.bibleandjournalapp.com/resourceslive/app/" + appId + "/config.json", function() { 
						home.buildWidgets();
					});
				}
				
			}
		});
		
		
		
		$(document).live("user-logout", function(event) {
			if (baja.get("os") == "web") {
				var appId = "bajaweb";
				readConfig("https://dashboard.bibleandjournalapp.com/resourceslive/app/" + appId + "/config.json", function() { 
					home.buildWidgets();
					baja.showSignIn(true);
				});
			}
			else {
				if (config.loginAll != null && config.loginAll != false) {
					app.navigate("#front-login", "none");
				}
			}
		});
		
	},

	initHome: function() {
		window.console && console.log("baja.initHome()");
		home.buildWidgets();
		// fade in
		setTimeout(function() {
			if (runNative) {
				navigator.splashscreen.hide();
				window.console && console.log("hiding splash");
			}
			$("#home-inner").css("-webkit-transition", "opacity 1s").css("opacity", "1");
			debugTimeEnd = new Date();
			var diff = Date.DateDiff("ms", debugTimeStart, debugTimeEnd);
			window.console && console.log("** Elapsed time init: " + diff + " ms **");
		}, 200);
	
		baja.buildMenu();
	},

	initFrontLogin: function() {
		setTimeout(function() {
			if (baja.get("os") != "web") {
				navigator.splashscreen.hide();
			}
			data = config.appHttpRoot + "/assets/logo.jpg";
			template = kendo.template($("#template-home-logo").html());
			$("#home-front-login").prepend(template(data));
			$("#home-front-login").css("-webkit-transition", "opacity 2s").css("opacity", "1");
			debugTimeEnd = new Date();
			var diff = Date.DateDiff("ms", debugTimeStart, debugTimeEnd);
			window.console && console.log("** Elapsed time init: " + diff + " ms **");
		}, 200);
	},
	
	showFrontLogin: function() {
		
	},
	
	buildMenu: function() {
		$("#menu .scroll").kendoMobileScroller();
	},

	showHome: function() {
		baja.trackView("/home");
	},

	bindWidgetData: function(data, templateId, moduleId) {
		/*
		var template = kendo.template($(templateId).html());
		$(moduleId + " .widget-content").empty().append(template(data.mediaItems[0]));
		*/
	},

	openInternalLink: function(button) {
		var url = $(button).attr("ref");
		if (baja.get("os") == "android" || baja.get("os") == "web") {
			window.open(eval(url), '_blank', 'location=yes');
		}
		else {
			if (window.plugins.childBrowser != null) {
				cordova.exec('ChildBrowserCommand.showWebPage', eval(url));
			}
			else {
				window.open(eval(url), '_blank', 'location=yes');
			}
		}
	},
	
	loadUrlChildBrowser: function(url) {
		cordova.exec('ChildBrowserCommand.showWebPage', url);
	},
	
	loadUrl: function(url) {
		if (baja.get("os") == "ios" || baja.get("os") == "web") {
			window.open(url, '_blank', 'location=yes');
		}
		else {
			if (window.plugins.childBrowser != null) {
				cordova.exec('ChildBrowserCommand.showWebPage', url);
			}
			else {
				window.open(url, '_blank', 'location=yes');
			}
		}
	},
	
	loadUrlNoLocation: function(url) {
		window.open(url, '_blank', 'location=no');
	},
	
	loadUrlNative: function(url) {
		if (url.indexOf("www.planetshakers.com/kingdom") > -1 && baja.get("os") == "android") {
			window.open(url, '_system', 'location=yes');
		}
		else {
			window.open(url, '_blank', 'location=yes');
		}
	},
	
	loadUrlExternal: function(url) {
		window.open(url, '_system', 'location=yes');
	},
	
	setCurrentTab: function(url) {
		$("#custom-tabstrip").data("kendoMobileTabStrip").switchTo(url);
	},

	handleBackButton: function(e) {
		if (baja.get("modalOpen")) {
			window.console && console.log("modal open TRUE");
			var modals = new Array(3);
			modals[0] = "#journal-edit";
			modals[1] = "#login";
			modals[2] = "#forgotpassword";
			for (var i=0;i < modals.length; i++) {
				window.console && console.log(modals[i]);
				var dialog = $(modals[i]).data("kendoMobileModalView");
				if (dialog != null) {
					dialog.close();
				}
			}
			baja.set("modalOpen", false);
		}
		else if (baja.get("menuOpen")) {
			baja.toggleMenu();
		}
		else {
			var view = app.view().id.replace(/#/,"");
			window.console && console.log(view);
			switch(view) {
				case "home":
					baja.exitApp();
					break;
				case "journal":
				case "bible":
				case "bible-plan":
				case "media-categories":
				case "mediafeed":
				case "music-collections":
				case "events":
					app.navigate("home");
					break;
				case "mediaitem":
				case "music-tracks":
				case "bible-books":	
				case "bible-versions":
				case "register":
				case "settings":
				case "settings-font":
				case "settings-font-size":
				case "share-facebook":
					app.navigate("#:back");
					break;
				case "journal-entry":
					app.navigate("journal-entries");
					break;
				case "journal-entries":
					app.navigate("journal-redirect");
					break;
				case "journal-entry-edit":
					navigator.notification.confirm("If you leave this journal entry without saving you will lose any unsaved changes.\nAre you sure you want to do this?", function(buttonIndex) {
						if (buttonIndex == 1) {
							app.navigate("journal-entries");
						}
					}, "Just Checking...", "Yes,No");
					break;
			}
		}
	},

	exitApp: function() {
		navigator.notification.confirm("Are you sure you want to exit this app?", function(buttonIndex) {
			if (buttonIndex == 1) {
				audio.kill();
				navigator.app.exitApp();
			}
		}, "Exit?", "Yes,No")
	},

	trackView: function(view) {
		if (useAnalytics) {
			if (kendo.support.mobileOS.name == "ios") {
				window.GA.trackView(view);
			}
			else {
				window.plugins.analytics.trackPageView(view, function(){ window.console && console.log("TRACK VIEW: " + view); }, function(){ window.console && console.log("ERROR Tracking View"); });
			}
		}
	},

	trackEvent: function(category, action, label, value) {
		if (useAnalytics) {
			if (kendo.support.mobileOS.name == "ios") {
				window.GA.trackEventWithCategory(category,action,label,value);
			}
			else {
				window.plugins.analytics.trackEvent(category, action, label, 1, function(){ window.console && console.log("TRACK EVENT: " + action); }, function(){ window.console && console.log("ERROR Tracking Event"); });
			}
		}
	},

	showSignIn: function(wait) {
		baja.trackView("/signin");
		
		var timeout = 10;
		if (wait) {
			timeout = 300;
		}
		setTimeout(function() {
			var dialog = $("#login").data("kendoMobileModalView");
			dialog.open();
			baja.set("modalOpen", true);
		}, timeout);
	},

	closeSignIn: function() {
		baja.set("modalOpen", false);
	},
	
	openForgotPassword: function(e) {
		baja.trackView("/forgotpassword");
		
	},

	closeForgotPassword: function(e) {
		baja.set("modalOpen", false);
	},
	
	authenticateUser: function(callback) {
		if (localStorage.getObject("user") != null) {
			var user = localStorage.getObject("user");
			baja.trackEvent("user", "login-auto", "User logged in automatically", 0);
			callback(user);
		}
		else {
			callback(null);
		}
	},

	registerUser: function() {
		if (baja.get("user") != null) {
			return baja.updateUser();
		}
		if (!$("#button-register").hasClass("disabled")) {
			baja.trackEvent("user", "registration", "New user registration attempt", 0);
			$("#button-register").addClass("disabled");
			app.showLoading();
			var newUser = {
				Id: 0,
				Username: $.trim($("#register_username").val()),
				Password: $.trim($("#register_password").val()),
				Email: $.trim($("#register_email").val()),
				AppId: clientId
			};
			$.ajax({
				url: config.registerUrl,
				type: "POST",
				dataType: "json",
				contentType: "application/json;charset=utf-8",
				data: JSON.stringify(newUser),
				success: function(user) {
					if (user != null && user.Id > 0) {
						baja.trackEvent("user", "registration-success", "User registration successful", 0);
						window.console && console.log(user.Id + ":" + user.Username);
						localStorage.setObject("user", user);
						baja.set("user", user);
						journal.set("user", user);
						$("#menu-item-signout").show();
						app.navigate("#:back");
					}
					else {
						alert("error: userid == 0");
					}
				},
				error: function() {
					baja.trackEvent("user", "registration-ajax-error", "User registration failure", 0);
                    var msg = "We could not register your account.\nIs your data connection working?";
					navigator.notification.alert(msg, null, "Could not register", "OK");
				},
				complete: function() {
					app.hideLoading();
					$("#button-register").removeClass("disabled");
				}
			});
		}
	},

	updateUser: function() {
		if (!$("#button-register").hasClass("disabled")) {
			baja.trackEvent("user", "update", "User update attempt", 0);
			$("#button-register").addClass("disabled");
			app.showLoading();
			var newUser = baja.get("user");
			newUser.Username = $.trim($("#register_username").val()),
			newUser.Password = $.trim($("#register_password").val()),
			newUser.Email = $.trim($("#register_email").val())

			$.ajax({
				url: config.registerUrl,
				type: "POST",
				dataType: "json",
				contentType: "application/json;charset=utf-8",
				data: JSON.stringify(newUser),
				success: function(user) {
					if (user != null && user.Id > 0) {
						baja.trackEvent("user", "update-success", "User update successful", 0);
						window.console && console.log(user.Id + ":" + user.Username);
						localStorage.setObject("user", user);
						baja.set("user", user);
						journal.set("user", user);
						$("#menu-item-signout").show();
						var msg = "Your account has been updated.";
						navigator.notification.alert(msg, null, "Update Successful", "OK");
						app.navigate("#:back");
					}
					else {
						alert("error: userid == 0");
					}
				},
				error: function() {
					baja.trackEvent("user", "update-ajax-fail", "User update failed", 0);
                    var msg = "We could not update your account.\nIs your data connection working?";
					navigator.notification.alert(msg, null, "Could not update account", "OK");
				},
				complete: function() {
					app.hideLoading();
					$("#button-register").removeClass("disabled");
				}
			});
		}
	},

	validateField: function(field) {
		$(field).removeClass("error").removeAttr("data-error");
		var fieldLength = $.trim($(field).val()).length;
		var fieldValue = $.trim($(field).val());
		var fieldHasErrors = false;
		var errorMessage = "";
		switch(field.id) {
			case "register_username":
				if (fieldLength == 0) {
					fieldHasErrors = true;
					errorMessage = "Invalid username";
				}
				baja.set("regUsernameValid", !fieldHasErrors);
				break;
			case "register_email":
				if (fieldLength == 0) {
					fieldHasErrors = true;
					errorMessage = "Invalid email";
				}
				else if (!isValidEmail(fieldValue)) {
					fieldHasErrors = true;
					errorMessage = "Invalid email format";
				}
				baja.set("regEmailValid", !fieldHasErrors);
				break;
			case "register_password":
				if (fieldLength == 0 && baja.get("user") == null) {
					fieldHasErrors = true;
					errorMessage = "Invalid password";
				}
				if (fieldLength > 0 && fieldLength < 6) {
					fieldHasErrors = true;
					errorMessage = "Password needs at least 6 characters";
				}
				baja.set("regPasswordValid", !fieldHasErrors);
				break;
			case "register_password2":
				if (fieldLength == 0 && baja.get("user") == null) {
					fieldHasErrors = true;
					errorMessage = "Invalid password";
				}
				if (fieldLength > 0 && fieldValue != $.trim($("#register_password").val())) {
					fieldHasErrors = true;
					errorMessage = "Passwords must match";
				}
				baja.set("regPassword2Valid", !fieldHasErrors);
				break;
		}
		if (fieldHasErrors) {
			$(field).addClass("error");
			$(field).attr("data-error", errorMessage);
			baja.updateRegisterButton();
		}
		else {
			// email field requires another async check...
			if (field.id == "register_email") {
				var userId = 0;
				if (baja.get("user") != null) {
					userId = baja.get("user").Id;
				}
				checkEmailInUse(fieldValue, userId, function(isInUse) {
					if (isInUse) {
						fieldHasErrors = true;
						errorMessage = "Email already in use";
						$(field).addClass("error");
						$(field).attr("data-error", errorMessage);
						$("#button-register").removeClass("disabled").addClass("disabled");
					}
					else {
						baja.updateRegisterButton();
					}
				});
			}
			else {
				baja.updateRegisterButton();
			}
		}
	},

	updateRegisterButton: function() {
		if (baja.get("regUsernameValid") && baja.get("regEmailValid") && baja.get("regPasswordValid") && baja.get("regPassword2Valid")) {
			$("#button-register").removeClass("disabled");
		}
		else {
			$("#button-register").removeClass("disabled").addClass("disabled");
		}
	},

	onUserLoggedIn: function() {
		$("#menu-item-signout").show();
		$("#menu-item-signin").hide();
		$("#menu-item-account").show();
		var event = $.Event("user-login");
		event.user = baja.get("user");
		$(document).trigger(event);
	},

	onUserLoggedOut: function() {
		$("#menu-item-signout").hide();
		$("#menu-item-signin").show();
		$("#menu-item-account").hide();
		var event = $.Event("user-logout");
		$(document).trigger(event);
	},

	login: function() {
		baja.trackEvent("user", "login", "User login attempt", 0);
        window.scrollTo(0,0);
		var username = $("#login_username").val();
		var password = $("#login_password").val();
		$.ajax({
			url: config.authUrl,
			type: "GET",
			dataType: "json",
			data: { username: username, password: password },
			success: function(user) {
				if (user !== null) {
					baja.trackEvent("user", "login-success", "User login successful", 0);
					localStorage.setObject("user", user);
					baja.set("user", user);
					var view = $("#login").data("kendoMobileModalView");
					view.close();
					baja.onUserLoggedIn();
				}
				else {
					baja.trackEvent("user", "login-fail", "User login failed", 0);
					var msg = "Your username or password was invalid.";
					navigator.notification.alert(msg, null, "Could not sign in", "OK");
				}
			},
			error: function() {
				baja.trackEvent("user", "login-ajax-error", "User login error", 0);
                var msg = "We could not sign you in.\nIs your data connection working?";
				navigator.notification.alert(msg, null, "Could not sign in", "OK");
			}
		});
	},

	logout: function() {
		localStorage.setObject("user", null);
		baja.set("user", null);
		baja.onUserLoggedOut();
		window.console && console.log("user signed out");
	},

	onTabSelect: function(tabIndex) {
		//window.console && console.log("TAB INDEX: " + tabIndex);
		var actualView = config.tabs[tabIndex].view;
		//window.console && console.log("TAB SELECT VIEW: " + actualView);
		/*if (baja.get("isTablet") && config.tabs[tabIndex].tabletView != undefined) {
			actualView = config.tabs[tabIndex].tabletView;
		}
		app.navigate(actualView);
		if (config.tabs[tabIndex].click) {
			eval(config.tabs[tabIndex].click);
		}*/
	},

	toggleMenu: function(e) {
		if (!baja.get("menuOpen")) {
			$("#menu").show();
			$("#overlay").show();
			if (baja.get("os") == "ios") {
				$(app.view().id).css("transform", "translate3d(275px,0,0)");
			}
			else {
				$(app.view().id).css("left", "275px");
			}
			setTimeout(function() { $("#menu").css("zIndex", 20000); }, 250);
			baja.set("menuOpen", true);
			window.console && console.log("menu open");
		}
		else {
			$("#menu").css("zIndex", -20000);
			$("#overlay").hide();
			if (baja.get("os") == "ios") {
				$(app.view().id).css("transform", "translate3d(0,0,0)");
			}
			else {
				$(app.view().id).css("left", "0");
			}
			baja.set("menuOpen", false);
			$("#menu").hide();
			window.console && console.log("menu closed");
		}
	},

	saveSettings: function(setting, value, ctrl) {
		if (bible !== undefined) {
			if (setting == "font") {
				$("#list-font li").removeClass("selected");
				$(ctrl).addClass("selected");
				bible.set("font", parseInt(value));
				app.navigate("#:back");
			}
			if (setting == "fontSize") {
				$("#list-font-size li").removeClass("selected");
				$(ctrl).addClass("selected");
				bible.set("fontSize", value);
				app.navigate("#:back");
			}

			var textDisplay = $("#s-lowlight")[0].checked ? "lowlight" : "normal";
			bible.set("textDisplay", textDisplay);
			bible.saveSettings();
			bible.applyTextSettings();
		}
	},

    initSettings: function(e) {
    	if (config.locations != null && config.locations.length > 0) {
    		$("#divSettingsLocations,#listSettingsLocations").show();
    		$("#s-location").before("<span class='settings-label'>Location</span>");
    	}
    	else {
    		$("#divSettingsLocations,#listSettingsLocations").hide();
    	}
        $("#s-font").before("<span class='settings-label'>Font</span>");
        $("#s-font-size").before("<span class='settings-label'>Font Size</span>");
		var event = $.Event("app-settings-init");
		$(document).trigger(event);
    },

	showSettings: function(e) {
		baja.trackView("/settings");
		if (bible !== undefined) {
			if (config.locations != null && config.locations.length > 0) {
				var location = baja.get("currentLocation");
				$("#s-location").text(location != null ? location.name : "None");
			}
			$("#s-font").text(fonts[bible.get("font")-1]);
			$("#s-font-size").text(bible.get("fontSize"));
			var isLowLight = bible.get("textDisplay") == "lowlight" ? true : false;
			$("#s-lowlight").data("kendoMobileSwitch").check(isLowLight);
		}
	},

	initSettingsLocations: function(e) {
		$("#list-settings-locations").kendoMobileListView({
			dataSource: config.locations,
			style: "inset",
			template: $("#template-location").html(),
			click: function(e) {
				var location = e.dataItem;
				baja.setCurrentLocation(location);
				$("#list-settings-locations li a").removeClass("selected");
				$("#list-settings-locations li a[ref='" + (location != null ? location.id : "") + "']").addClass("selected");
				app.navigate("#:back");
			}
		});
	},
	
	showSettingsLocations: function(e) {
		var location = baja.get("currentLocation");
		$("#list-settings-locations li a").removeClass("selected");
		$("#list-settings-locations li a[ref='" + (location != null ? location.id : "") + "']").addClass("selected");
	},
	
	showFont:  function(e) {
		baja.trackView("/settings-font");
		if (bible != undefined) {
			$("#list-font li").removeClass("selected");
			$("#list-font [ref='" + bible.get("font") + "']").addClass("selected");
		}
	},

	showFontSize: function(e) {
		baja.trackView("/settings-font-size");
		if (bible != undefined) {
			$("#list-font-size li").removeClass("selected");
			$("#list-font-size [ref='" + bible.get("fontSize") + "']").addClass("selected");
		}
	},

	showRegisterUser: function(e) {
		baja.trackView("/register");
		if (baja.get("user") != null) {
			var user = baja.get("user");
			$("#hintCreateAccount").hide();
			$("#hintUpdateAccount").show();
			$("#button-register").text("Update Account");
			$("#register_username").val(user.Username);
			$("#register_email").val(user.Email);
			$("#register_password").val("")
			$("#register_password2").val("")
			// pre-validate
			baja.set("regUsernameValid", true);
			baja.set("regEmailValid", true);
			baja.set("regPasswordValid", true);
			baja.set("regPassword2Valid", true);
			baja.updateRegisterButton();
		}
		else {
			$("#hintUpdateAccount").hide();
			$("#hintCreateAccount").show();
			$("#button-register").text("Register");
			$("#register_username").val("");
			$("#register_email").val("");
			$("#register_password").val("")
			$("#register_password2").val("")
			// pre-validate
			baja.set("regUsernameValid", false);
			baja.set("regEmailValid", false);
			baja.set("regPasswordValid", false);
			baja.set("regPassword2Valid", false);
			baja.updateRegisterButton();
		}
	},

	showErrorTip: function(input) {
		var msg = input.attr("data-error");
		var tip = $("<div class='error-tip'>" +  msg + "</div>");
		tip.hide();
		var offset = input.offset();
		input.before(tip);
		tip.css("right", offset.left + 23)
		tip.css("top", offset.top - 32);
		tip.fadeIn(300);
	},

	hideErrorTip: function(input) {
		var tip = input.siblings("div").first();
		if (tip != null) {
			tip.fadeOut(300, function() { tip.remove(); });
		}
	},

	setCurrentLocation: function(location) {
		baja.set("currentLocation", location);
		localStorage.setObject("currentLocation", location);
	},
	
	showLocationPicker: function(callback) {
		var view = $("#locations").data("kendoMobileModalView");
		view.open();
		baja.set("modalOpen", true);
		if ($("#list-locations").data("kendoMobileListView") == null) {
			$("#list-locations").kendoMobileListView({
				dataSource: config.locations,
				style: "inset",
				template: $("#template-location").html(),
				click: function(e) {
					baja.setCurrentLocation(e.dataItem);
					var view = $("#locations").data("kendoMobileModalView");
					view.close();
					if (typeof callback == "function") {
						callback();
					}
				}
			});
		}
	},
	
	showForgotPassword: function() {
		var view1 = $("#login").data("kendoMobileModalView");
		view1.close();
		setTimeout(function() {
			var view2 = $("#forgotpassword").data("kendoMobileModalView");
			view2.open();
			baja.set("modalOpen", true);
		}, 500);
	},

	closeForgotPassword: function() {
		baja.set("modalOpen", false);
	},

	resetPassword: function() {
		var email = $.trim($("#forgotpw_email").val());
	    if (isValidEmail(email)) {
			$.ajax({
				url: config.resetPasswordUrl,
				type: "GET",
				async: false,
				dataType: "json",
				data: { email:email },
				success: function() {
					baja.trackEvent("user", "resetpassword-success", "User password reset successfully", 0);
					var msg = "Your password has been reset.\nPlease check your email for a message containing your new password";
					navigator.notification.alert(msg, null, "Password Reset", "OK");
					var view2 = $("#forgotpassword").data("kendoMobileModalView");
					view2.close();
				},
				error: function(jqXHR, textStatus, errorThrown) {
					baja.trackEvent("user", "resetpassword-ajax-fail", "User password reset failed", 0);
					var msg = errorThrown
					navigator.notification.alert(msg, null, "Password Reset Failed", "OK");
				}
			});
		}
		else {
			var msg = "Please enter a correctly-formatted email address.";
			navigator.notification.alert(msg, null, "Email Address", "OK");
		}
	},

	shareFromMenu: function(method) {
		window.console && console.log("shareFromMenu: " + method);
		var message = "";
		var url = "";
		var subject = "";
		var body = "";
		var title = "";
		switch(method) {
			case "facebook":
				message = config.sharing.facebook.shareText.replace("{storeUrl}", config.appStoreUrl);
				message += "\n\n" + config.sharing.sentByText;
				url = config.sharing.facebook.shareUrl;
				title = config.sharing.facebook.title;
				baja.postFacebook(message, url, title);
				break;

			case "twitter":
				message = config.sharing.twitter.shareUrl;
				url = config.sharing.twitter.shareUrl;
				baja.postTwitter(message, url);
				break;

			case "mail":
		    case "email":
		    	subject = config.sharing.email.shareSubject;
				body = config.sharing.email.shareBody.replace("{storeUrl}", config.appStoreUrl);
				baja.postEmail(subject, body);
				break;
		}
	},

	showSharePanel: function(ctrl, context, wait, shareData) {
		baja.trackView("/sharepanel");
		baja.set("shareContext", context);
		baja.set("shareData", shareData);
		var timeout = 10;
		if (wait) {
			timeout = 300;
		}
		setTimeout(function() {
			var panel = $("#sharing").data("kendoMobileActionSheet");
            panel.open($(ctrl));
		}, timeout);
	},

	share: function(method, event) {
		var message = "";
		var url = "";
		var subject = "";
		var body = "";
		var title = "";
		var data = baja.get("shareData");
		if (data != null) {
			switch(baja.get("shareContext")) {
				case "music":
					var item = data.item;
					message = item.title;
					message += " \n" + data.url + "\n";
					switch(method) {
						case "facebook":
							message = item.title;
							message += "\n" + data.url + "\n";
							message += "\n" + config.sharing.sentByText;
							url = config.sharing.facebook.shareUrl;
							title = config.sharing.facebook.title;
							break;
			
						case "twitter":
							message = item.title + " " + data.url + " " + config.sharing.sentByTwitter;
							url = config.sharing.twitter.shareUrl;
							break;
			
						case "mail":
						case "email":
							subject = item.title + " by " + item.author;
							body = "You should check out <a href='" + data.url + "'>" + item.title + "</a>";
							body += "<br/><br/>" + config.sharing.sentByHtml.replace("{storeUrl}", config.appStoreUrl);
							break;
					}
					break;
				case "media":
					var item = data.item;
					message = item.title + " by " + item.author;
					message += " \n" + data.url + "\n";
					switch(method) {
						case "facebook":
							message = item.title + " by " + item.author;
							message += "\n" + data.url + "\n";
							message += "\n" + config.sharing.sentByText;
							url = config.sharing.facebook.shareUrl;
							title = config.sharing.facebook.title;
							break;
			
						case "twitter":
							message = item.title + " by " + item.author + " " + data.url + " " + config.sharing.sentByTwitter;
							url = config.sharing.twitter.shareUrl;
							break;
			
						case "mail":
						case "email":
							subject = item.title + " by " + item.author;
							body = "You should listen to <a href='" + data.url + "'>" + item.title + "</a> by " + item.author;
							body += "<br/><br/>" + config.sharing.sentByHtml.replace("{storeUrl}", config.appStoreUrl);
							break;
					}
					break;
					
				case "bible":
					message = strip(data.text, true);
					switch(method) {
						case "facebook":
							message = data.reference + "\n\n" + strip(data.text, true) + "\n\n" + config.sharing.sentByText;
							url = config.sharing.facebook.shareUrl;
							break;
						case "twitter":
							message = strip(data.text, true) + " " + config.sharing.sentByTwitter;
							break;
						case "mail":
						case "email":
							subject = data.reference;
							body = data.text + "<br/><br/>" + config.sharing.sentByHtml.replace("{storeUrl}", config.appStoreUrl);;
							break;
					}
					break;
					
				case "journal":
					message = data.text;
					switch(method) {
						case "facebook":
							message = data.text + "\n\n" + config.sharing.sentByText;
							url = config.sharing.facebook.shareUrl;
							break;
						case "twitter":
							message = data.text + " " + config.sharing.sentByTwitter;
							break;
						case "mail":
						case "email":
							subject = data.title;
							body = data.html + "<br/><br/>" + config.sharing.sentByHtml.replace("{storeUrl}", config.appStoreUrl);;
							break;
					}
					break;
			}
			message = $.trim(message);
			subject = $.trim(subject);
			body = $.trim(body);
		}
		switch(method) {
			case "facebook":
				window.console && console.log(message);
				baja.postFacebook(message, url, title);
				break;
			case "twitter":
				baja.postTwitter(message, url);
				break;
			case "mail":
		    case "email":
				baja.postEmail(subject, body);
				break;
			case "copy":
				baja.copyToClipboard(message);
				break;
			case "message":
			case "sms":
				baja.postSMS(message);
				break;
		}
		var panel = $("#sharing").data("kendoMobileActionSheet");
		panel.close();
	},

	copyToClipboard: function(text) {
		if (baja.get("os") == "ios") {
			window.cordova.exec("ClipboardPlugin.setText", text);
			navigator.notification.alert("Copied to clipboard!", null, "Copy", "OK");
		}
		else {
			window.console && console.log(text);
			ClipboardManager.copy(
				$.trim(text),
				function(r){ navigator.notification.alert("Copied to clipboard!", null, "Copy", "OK"); },
				function(e){ }
			);
		}
	},
	
	postFacebookDirect: function(e) {
		var facebookConnect = window.plugins.facebookConnect;
		facebookConnect.login({permissions: ["email", "publish_stream"], appId: config.facebook.appId}, function(result) {
			window.console && console.log("FacebookConnect.login:" + JSON.stringify(result));
		
			// Check for cancellation/error
			if(result.cancelled || result.error) {
				window.console && console.log("FacebookConnect.login:failedWithError:" + result.message);
				return;
			}
			var message = $("#text-facebook").val();
			var url = $("#facebook-url").val();
			var title = $("#facebook-title").val();
			facebookConnect.requestWithGraphPath("/me/feed", { message: message, link: url, name: title }, "POST", function(result) {
				app.navigate("#:back");
			});
		});
	},
	
	postFacebook: function(message, url, title) {
		message = $.trim(message);
		if (baja.get("os") == "ios") {
			window.plugins.shareKit.shareToFacebook(message, url, title);
		}
		else {
			$("#text-facebook").val(message);
			$("#facebook-url").val(url);
			$("#facebook-title").val(title);
			app.navigate("share-facebook");
		}
	},
	
	postTwitter: function(message, url) {
		message = $.trim(message);
		if (baja.get("os") == "ios") {
			window.plugins.shareKit.shareToTwitter(message, url);
		}
		else {
			Twitter.isTwitterAvailable(
				function(bool){ 
					if(bool){
						Twitter.composeTweet(
							 function(){
							 	window.console && console.log("successful tweet");
							 },
							 function(){
								navigator.notification.alert("Could not post to Twitter.", null, "Twitter", "OK");
							 },
							 message
						);
						
					} else {
						navigator.notification.alert("Twitter is not available on this device.", null, "Twitter", "OK");
					}
				},
				function(){
					window.console && console.log("We have a problem with the plugin");
				}
			);
		}
	},
	
	postEmail: function(subject, body) {
		body = $.trim(body);
		if (baja.get("os") == "ios") {
			window.plugins.shareKit.shareToMail(subject, body);
		}
		else {
			window.plugins.emailComposer.showEmailComposer(subject,body,[],[],[],true,[]);
		}
	},
	
	postSMS: function(message) {
		message = $.trim(message).replace(/[\t\r\n]/g, "").replace(/\s{2,}/g," ");
		if (baja.get("os") == "ios") {
			window.plugins.smsComposer.showSMSComposer(null, message);
		}
		else {
			window.console && console.log(message);
			SMSComposer.open(message, 
				function () { 
				      
				},
				function (e) {
					window.console && console.log(e);
				}
			);
		}
	}
	
});

window.console && console.log("baja module initialized");