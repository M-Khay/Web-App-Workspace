from urllib2 import *
import urllib
import json
import sys

MY_API_KEY="AIzaSyDjRYN0TSlNGUV54AkNPCbUefEblfOttDo"
messageTitle = sys.argv[1]
messageBody = sys.argv[2]

data={
    "to" : "/topic/what_topic",
    "notification" : {
        "body" : messageBody,
        "title" : messageTitle,
        
    }
}
dataAsJSON = json.dumps(data)

request = Request(
    "https://gcm-http.googleapis.com/gcm/send",
    dataAsJSON,
    { "Authorization" : "key=AIzaSyChCbUBhPnGJthzWdnjwRObGkZT2n9FHBA",
      "Content-type" : "application/json"
    }
)


print urlopen(request).read()