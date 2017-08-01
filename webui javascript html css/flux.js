// Utilities for Flux
// WG.actions for actions
// WG.Storage function for global store

(function() {

WG = window.WG || {};

WG.actions = {
    STATE: "STATE",
        SET_LOADING: "STATE.SET_LOADING",
        FOCUS_GET_APP: "STATE.FOCUS_GET_APP",
        SEARCH: "STATE.SEARCH",
            ACTIVATE_SEARCH: "STATE.SEARCH.ACTIVATE",
            DECTIVATE_SEARCH: "STATE.SEARCH.DEACTIVATE",

    ANNOUNCEMENT: "ANNOUNCEMENT",
        SHOW_WARNING: "ANNOUNCEMENT.SHOW_WARNING",
        SHOW_INFO: "ANNOUNCEMENT.SHOW_INFO",
        SHOW_ERROR: "ANNOUNCEMENT.SHOW_ERROR",
        SHOW_SUCCESS: "ANNOUNCEMENT.SHOW_SUCCESS",

    POLLS: "POLLS",
        RENDER_POLLS: "POLLS.RENDER",
        RESET_POLLS: "POLLS.RESET",
        SHOW_POLL_COUNT: "POLLS.COUNT",
        VOTE_ON_POLL: "POLLS.VOTE",

    USER: "USER",
        CREATE_USER: "USER.CREATE",
        UPDATE_USER: "USER.UPDATE",

    // For WG.Storage
    STORAGE: "Storage",
        STORED_USER: "Storage.STORED.user",
        STORE_USER: "Storage.STORE.user",
};

// Storage

var shouldWarnIncognito = true;

function Storage(key) {
  if (!key) {
    throw new Error("No key provided");
  }

  // if (!('localStorage' in window) || !localStorage) {
  //   window.localStorage = 
  // }
  
  this._storageKey = key;
  try {
    this.load();
  } catch(e) {
    console.warn(e);
    Storage.checkAlert();
  }

  PubSub.subscribe("Storage.STORE." + key, function(topic, data) {
    this.set(data);
    PubSub.publish("Storage.STORED." + key, this.get());
  }.bind(this));

  return this;
}

// Use get when cache is trusted
Storage.prototype.get = function() {
  return this._data;
}

// Use load when cache isn't trusted
Storage.prototype.load = function() {
  var serializedData = localStorage.getItem(this._storageKey);

  if (serializedData) {
    try {
      this._data = JSON.parse(serializedData);
    } catch (e) {
      destroy();
    }
  } else {
    this._data = null;
  }
  
  return this._data;
}

Storage.prototype.set = function(data, tries) {
  tries = tries || 0;
  this._data = $.extend({}, this._data, data);

  try {

    localStorage.setItem(this._storageKey, JSON.stringify(this._data));
    return true;

  } catch (e) {
    // might be incognito! or something dumb
    console.warn(e);

    if (tries < 1) {
      // localStorage might be filled up
      Storage.destroyAll();
      return this.set(data, tries + 1);

    } else {
      Storage.checkAlert();
    }
    return false;
  }
}

Storage.prototype.destroy = function() {
  this._data = null;
  localStorage.removeItem(this._storageKey);
}

Storage.destroyAll = function() {
  localStorage.clear();
};

Storage.checkAlert = function() {
  if (shouldWarnIncognito) {
    alert("Looks like you're browsing privately 👀\n" +
      ["This app is much more useful if you can contribute your vote.", 
      "Open a normal window on your browser, use Chrome, or allow",
      "local storage."].join(' ')
    );
    shouldWarnIncognito = false;
  }
}

WG.Storage = Storage;

})();