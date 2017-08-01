

var changeContent = document.querySelector('button');

changeContent.onclick = function(){

var heading = document.querySelector('p');
heading.textContent= "Fuck yea";

}


function loadImage(){
	var url = $(".imageURL1").val()
 $('#imgContainer').attr('src',url)
}



function imgLoad() {
var urlView = document.getElementById('imageURL1');
var url = urlView.value;
var imageContainer =  document.getElementById('imgContainer');

var xhr = createCORSRequest('GET', url);
if (!xhr) {
  throw new Error('CORS not supported');
}
 xhr.onload = function() {
 var responseText = xhr.responseText;
 console.log(responseText);
 // process the response.
};

xhr.onerror = function() {
  console.log('There was an error!');
};
 xhr.send();

}


function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);

  } else if (typeof XDomainRequest != "undefined") {

    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);

  } else {

    // Otherwise, CORS is not supported by the browser.
    xhr = null;

  }
  return xhr;
}


// imgLoad("http://pasteboard.co/9fIfmbGYT.png");
