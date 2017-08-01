(function() {

WG = window.WG || {};
var Raven = window.Raven;

$.ajaxSetup({
  beforeSend: function(xhr, settings) {
    // CSRF
    if (!WG.utils.csrfSafeMethod(settings.type) && !this.crossDomain) {
      var csrftoken = WG.utils.getCookie('csrftoken');
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }

    // For client validation
    if (WG.constants.WG_AUTH_HEADER != null) {
      xhr.setRequestHeader("WG-Auth", WG.constants.WG_AUTH_HEADER);
    }

    // For auth
    var user = WG.utils.getUser();
    if (user && user.token) {
      xhr.setRequestHeader("Authorization", "Token " + user.token.key);
    }

    // For tracking referrals
    var referrer = (window.location != window.parent.location)
                 ? document.referrer
                 : document.location.href;
    xhr.setRequestHeader("WG-Referrer", referrer);
  }
});

if (Raven) {
  $(function() {
    var user = WG.utils.getUser() || {};

    Raven.setUserContext({
      id: user.id
    });
    Raven.setExtraContext({
      gender: user.gender,
      age: user.age,
      karma: user.karma,
      is_staff: user.is_staff,
      university: (user.university || {}).name_short,
      username: user.username
    });
  });
}

})();