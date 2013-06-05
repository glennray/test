/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

// ***** Utility functions *****
function strip(html, removeBreaks) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   clean = tmp.textContent||tmp.innerText;
   if (removeBreaks) {
   	   clean = clean.replace(/[\t\r\n]/g, "").replace(/\s{2,}/g," ");
   }
   
   return clean;
}

function getTimeZoneString() {
	var now = new Date().toString();
	var TZ = now.indexOf('(') > -1 ?
	now.match(/\([^\)]+\)/)[0].match(/[A-Z]/g).join('') :
	now.match(/[A-Z]{3,4}/)[0];
	if (TZ == "GMT" && /(GMT\W*\d{4})/.test(now)) TZ = RegExp.$1;
	return TZ;
}

function htmlEncode(value){
    return $('<div/>').text(value).html();
}

function htmlDecode(value){
    return $('<div/>').html(value).text();
}

function isValidEmail(emailAddress) {
	var emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
	return emailAddress.search(emailRegEx) > -1;
}

function checkEmailInUse(email, userId, callback) {
	var isInUse = true;
	$.ajax({
		url: config.validateEmailUrl,
		type: "GET",
		async: false,
		dataType: "json",
		data: { email: email, userId: userId },
		success: function(inUse) {
			isInUse = inUse;
		},
		error: function() {
			window.console && console.log("error validating email address");
		},
		complete: function() {
			callback(isInUse);
		}
	});
}

Math.RandomInteger = function(n, m) {
    if (! m) {m = 1;} // default range starts at 1
    var max = n > m ? n : m; // doesn<q>t matter which value is min or max
    var min = n === max ? m : n; // min is value that is not max
    var d = max - min + 1; // distribution range
    return Math.floor(Math.random() * d + min);
};

function setCaretPosition(elemId, caretPos) {
    var elem = document.getElementById(elemId);

    if(elem != null) {
        if(elem.createTextRange) {
            var range = elem.createTextRange();
            range.move('character', caretPos);
            range.select();
        }
        else {
            if(elem.selectionStart) {
                elem.focus();
                elem.setSelectionRange(caretPos, caretPos);
            }
            else
                elem.focus();
        }
    }
}

function replaceSelectedText(replacementText) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(replacementText));
        }
    } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        range.text = replacementText;
    }
}

function execEditorCommand(command) {
	if (baja.get("os") != "web") {
		$("#entry-edit-div").focus();
	}
    document.execCommand(command);
    return document.queryCommandState(command);
}

function closeModalViewDirect(button) {
	var modalView = $(button).closest("[data-role=modalview]").data("kendoMobileModalView");
    modalView.close();
    clearTimeout(inputScrollTimer);
    $('#login_username,#login_password').die("blur,focus");
    baja.set("modalOpen", false);
}

function closeModalView(e) {
    // find the closest modal view, relative to the button element.
    window.scrollTo(0,0);
    var modalView = e.sender.element.closest("[data-role=modalview]").data("kendoMobileModalView");
    modalView.close();
    clearTimeout(inputScrollTimer);
    $('#login_username,#login_password').die("blur,focus");
    baja.set("modalOpen", false);
}

function compare(a,b) {
	if (a.date < b.date) return 1;
	if (a.date > b.date) return -1;
	return 0;
}

function reverseCompare(a,b) {
	if (a.date < b.date) return -1;
	if (a.date > b.date) return 1;
	return 0;
}

function contains(a, obj) {
	for (var i = 0; i < a.length; i++) {
		if (a[i] === obj) {
			return true;
		}
	}
	return false;
}
	
function secondsAsTime(secs) {
	var hr = Math.floor(secs / 3600);
	var min = Math.floor((secs - (hr * 3600))/60);
	var sec = Math.round(secs - (hr * 3600) - (min * 60));
	
	if (hr < 10) {hr = "0" + hr; }
	//if (min < 10) {min = "0" + min;}
	if (sec < 10) {sec = "0" + sec;}
	if (!hr) {hr = "00";}
    var output = "";
    if (hr > 0) {
        output += hr + ":";   
    }
    output += min + ":" + sec;
	return output;
}
	
var sort_by = function(field, reverse, primer){
   var key = function (x) {return primer ? primer(x[field]) : x[field]};

   return function (a,b) {
	  var A = key(a), B = key(b);
	  return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];                  
   }
};


window.console && console.log("utils module initialized");
