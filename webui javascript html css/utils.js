(function (){

var userDB = new WG.Storage("user");
var feedbackDB = new WG.Storage("feedback");
var D = React.DOM;
var ANNOUNCEMENT_HIDE_DELAY = 5000;
var DELAY_TO_SHOW_FEEDBACK_BAR = 15*1000;
var FEEDBACK_URL = "/feedback/new/";
var NUMBER_OF_MILLENNIALS = 75.4 * 1000 * 1000;

WG.constants = {
  MOTTO: "Anonymous campus polling",
  MOBILE_WIDTH: 767,
  NAVBAR_HEIGHT: $(".navbar").height(),
  BRANCH_BANNER_HEIGHT: 76,

  Feed: {
    LOCAL: 0,
    GLOBAL: 1,
    FEATURED: 2,
    MY_FEATURED: 3,
  },
  
  Poll: {
    GUYS: 0,
    GIRLS: 1,
    ALL: 2
  },

  User: {
    NOT_CHOSEN: -1,
    MALE: 0,
    FEMALE: 1,
    ALL: 2
  },
  
  BRANCH_LINK: "http://bnc.lt/whatsgoodly",
  WG_AUTH_HEADER: null, // Set via server template
  POLL_ID: null, // Set via server template

  SPINNER_SETUP: {
    lines: 11 // The number of lines to draw
  , length: 15 // The length of each line
  , width: 9 // The line thickness
  , radius: 21 // The radius of the inner circle
  , scale: 0.5 // Scales overall size of the spinner
  , corners: 1 // Corner roundness (0..1)
  , color: '#8A14CC' // #rgb or #rrggbb or array of colors
  , opacity: 0.25 // Opacity of the lines
  , rotate: 0 // The rotation offset
  , direction: 1 // 1: clockwise, -1: counterclockwise
  , speed: 1.5 // Rounds per second
  , trail: 75 // Afterglow percentage
  , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
  , zIndex: 2e9 // The z-index (defaults to 2000000000)
  , className: 'spinner' // The CSS class to assign to the spinner
  , top: '200px' // Top position relative to parent
  , left: '50%' // Left position relative to parent
  , shadow: false // Whether to render a shadow
  , hwaccel: false // Whether to use hardware acceleration
  , position: 'absolute' // Element positioning
  },
};

WG.utils = {
  isMobile: function() {
    return $(window).width() <= WG.constants.MOBILE_WIDTH
  },

  getCookie: function (name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  },

  parseQueryString: function() {
    var query = location.search || location.hash;
    if (!query) {
      return {};
    }
    return (/^[?#]/.test(query) ? query.slice(1) : query)
      .split('&')
      .reduce(function(params, param) {
        var pair = param.split('='),
            key = pair[0],
            value = pair[1];
        params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
        return params;
      }, {});
  },

  getUser: function() {
    return userDB.get();
  },

  resetUser: function() {
    return userDB.destroy();
  },
  
  csrfSafeMethod: function(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  },

  debounce: function(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  },

  groupBy: function(xs, key) {
    if (typeof key == 'string') {
      fn = function(obj) { return obj[key] };
    } else {
      fn = key;
    }
    return xs.reduce(function(rv, x) {
      (rv[fn(x)] = rv[fn(x)] || []).push(x);
      return rv;
    }, {});
  },

  values: function(obj) {
    return Object.keys(obj).map(function(key){
      return obj[key];
    });
  },

  find: function(obj, key) {
    if (key in obj)
      return [obj[key]];

    var res = [];
    for (var k in obj) {
      var v = obj[k];
      if (typeof v == "object" && (v = WG.utils.find(v, key)).length)
          res.push.apply(res, v);
    }
    return res;
  },

  numberWithCommas: function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  sample: function(array) {
    var index = Math.floor(Math.random() * array.length);
    return array[index];
  },

  uniq: function(array, fn) {
    var seen = {};
    return array.filter(function(item) {
      var key = item;
      if (fn) {
        key = fn(item);
      }
      return seen.hasOwnProperty(key) ? false : (seen[key] = true);
    });
  },

  getResponseCount: function(poll) {
    return poll.option_counts.reduce(WG.utils.add, 0);
  },

  add: function(a, b) {
    return a + b;
  },

  getDeeplinkData: function() {
    var referrer = (window.location != window.parent.location)
                   ? document.referrer
                   : document.location.href;
    var user = this.getUser();

    var deepLinkData = {
      url: document.location.href,
      referring_url: referrer
    };
    if (WG.constants.POLL_ID) {
      // We're looking at a specific poll
      deepLinkData['pollID'] = WG.constants.POLL_ID;
    }
    if (WG.constants.FEED_ID) {
      // We're looking at a specific feed
      deepLinkData['feedID'] = WG.constants.FEED_ID;
    }
    if (user && user.token) {
      deepLinkData['userID'] = user.id;
      deepLinkData['tokenKey'] = user.token.key;
    }

    return deepLinkData;
  },

  // TODO extend searchkit instead
  fixSearchkitFilter: function(filter, suffix) {
    if (!filter) return;
    suffix = suffix || "_root";
    if (filter.nested) {
      filter.nested.inner_hits = $.extend(
        {}, filter.nested.inner_hits, {name: filter.nested.path + suffix}
      );
    }
    if (filter.bool) {
      for (var condition in filter.bool) {
        filter.bool[condition].forEach(function(subFilter, i) {
          WG.utils.fixSearchkitFilter(subFilter, "_" + suffix + "_" + condition + i);
        });
      }
    }
  },

  // TODO fix
  fixSearchkitQuery: function(query) {
    if (!query) return;
    for (var condition in query.bool) {
      var options = query.bool[condition];

      for (var i = 0; i < options.length; i++) {
        var shouldNest = false;
        for (var type in options[i]) {
          var fields = options[i][type].fields;
          if (fields && fields[0].indexOf("breakdowns.") == 0) {
            shouldNest = true;
          }
        }
        if (shouldNest) {
          var optionDict = {};
          optionDict[condition] = options[i];
          options[i] = {
            "nested": {
              "path": "breakdowns",
              "score_mode": "avg", 
              "query": {
                "bool": optionDict
              }
            }
          }
        }
      }
    }
  },

  // http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
  isValidEmail: function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }
};

WG.MethodologyTooltip = React.createFactory(React.createClass({
  displayName: 'MethodologyTooltip',

  propTypes: {
    poll: React.PropTypes.shape({
        gender: React.PropTypes.number.isRequired,
        margin_of_error: React.PropTypes.number.isRequired
      }).isRequired,
    populationSize: React.PropTypes.number,
  },

  getDefaultProps: function() {
    return {
      populationSize: NUMBER_OF_MILLENNIALS
    }
  },

  onRender: function(elem) {
    if (!elem) return;
    $(function () {
      $(elem).tooltip({
        html: true,
        trigger: "click"
      });
    });
  },

  getTooltipContent: function() {
    var popSize = this.props.populationSize;
    var popLabel = "qualified US millennials";
    if (this.props.poll.gender == WG.constants.Poll.GUYS || this.props.poll.gender == WG.constants.Poll.GIRLS) {
      popSize = popSize / 2;
      // popLabel = popLabel + " who would qualify";
    }
    return "<strong>Results are +/- " + this.props.poll.margin_of_error + "%</strong>, given a <br/>" +
      "95% confidence interval and<br/>" +
      WG.utils.numberWithCommas(popSize) + " " + popLabel;
  },

  render: function() {
    var style = {
      fontSize: 18, marginTop: 15,
      marginBottom: 15, padding: 10
    };

    return (
      D.a({ className: "MethodologyTooltip",
            "data-toggle":"tooltip", "data-placement":"top",
            title: this.getTooltipContent(),
            ref: this.onRender},
        D.span({className: "glyphicon glyphicon-info-sign"})
      )
    )
  }
}));

WG.Methodology = React.createFactory(React.createClass({
  displayName: 'Methodology',

  propTypes: {
    poll: React.PropTypes.shape({
        option_counts: React.PropTypes.arrayOf(React.PropTypes.number.isRequired).isRequired,
        gender: React.PropTypes.number.isRequired,
        margin_of_error: React.PropTypes.number.isRequired
      }).isRequired,
    populationSize: React.PropTypes.number,
  },

  render: function() {
    var statsStyle = {
      fontSize: 18, marginTop: 15,
      marginBottom: 15, padding: 10
    };

    return (
      D.h3({className: "Methodology text-center row", style: statsStyle},
        WG.utils.getResponseCount(this.props.poll) + " respondents",
        D.small({className: "right"},
          "Margin of error: " + this.props.poll.margin_of_error + "%",
          "\u00a0\u00a0",
          WG.MethodologyTooltip({
            poll: this.props.poll,
            populationSize: this.props.populationSize
          })
        )
      )
    )
  }
}));

WG.Checkmark = React.createFactory(React.createClass({

  displayName: 'Checkmark',

  render: function() {
    return (
      D.svg({
        style: this.props.style,
        className: "Checkmark",
        xmlns: "http://www.w3.org/2000/svg",
        viewBox:"0 0 52 52"},
        D.circle({
          className: "Checkmark__circle",
          cx: "26",
          cy: "26",
          r: "25",
          fill: "none"}),
        D.path({
          className: "Checkmark__check",
          fill: "none",
          d: "M14.1 27.2l7.1 7.2 16.7-16.8"})
      )
    )
  }

}));


WG.Spinner = React.createFactory(React.createClass({

  displayName: 'Spinner',

  propTypes: {
    onClick: React.PropTypes.func,
    className: React.PropTypes.string,
    spinning: React.PropTypes.bool,
    scale: React.PropTypes.number
  },

  getDefaultProps: function() {
    return {
      className: "",
      spinning: true,
      scale: 1
    }
  },

  render: function() {
    var style = {
      cursor: this.props.onClick ? "pointer" : "auto"
    };
    var headStyle = {
      height: 150 * this.props.scale,
      position: 'relative',
      left: 0,
      top: 20 * this.props.scale,
      zIndex: 2
    };
    var propellerStyle = {
      height: 70 * this.props.scale,
      position: 'relative',
      left: -66 * this.props.scale,
      top: -49 * this.props.scale,
      zIndex: 1
    };
    
    return D.div({
          onClick: this.props.onClick,
          className: "Spinner " + this.props.className,
          style: style},
      D.img({
        className: "head",
        style: headStyle,
        src: "/static/whatsgoodly/img/logo-colored-no-propeller.png"
      }),
      D.img({
        className: "propeller " + (this.props.spinning ? "spinning" : ""),
        style: propellerStyle,
        src: "/static/whatsgoodly/img/propeller.png"
      })
    )
  }

}));

WG.Announcement = React.createFactory(React.createClass({

  displayName: 'Announcement',

  getInitialState: function() {
    return {
      active: false,
      className: '',
      message: null,
      isTemporary: true
    }
  },

  componentWillMount: function() {

    this.listeners = [
      PubSub.subscribe(WG.actions.SHOW_WARNING, function(topic, message) {
        this.setState({
          active: true,
          className: 'alert-warning',
          message: message
        });
        this.delayHide();
      }.bind(this)),

      PubSub.subscribe(WG.actions.SHOW_ERROR, function(topic, message) {
        this.setState({
          active: true,
          className: 'alert-danger',
          message: message
        });
        this.delayHide();
      }.bind(this)),

      PubSub.subscribe(WG.actions.SHOW_INFO, function(topic, message) {
        this.setState({
          active: true,
          className: 'alert-info',
          message: message
        });
        this.delayHide();
      }.bind(this)),

      PubSub.subscribe(WG.actions.SHOW_INFO_STICKY, function(topic, message) {
        this.setState({
          active: true,
          className: 'alert-info',
          message: message
        });
      }.bind(this)),

      PubSub.subscribe(WG.actions.SHOW_SUCCESS, function(topic, message) {
        this.setState({
          active: true,
          className: 'alert-success',
          message: message
        });
        this.delayHide();
      }.bind(this)),
    ];

  },

  componentWillUnmount: function() {
    this.listeners.map(PubSub.unsubscribe);
  },

  componentDidUpdate: function(prevProps, prevState) {
    var $this = $(ReactDOM.findDOMNode(this));

    if (this.state.active && !prevState.active) {
      $this.slideDown(200);
    }

    if (!this.state.active && prevState.active) {
      $this.slideUp(200);
    }
  },

  delayHide: function() {
    setTimeout(function() {
      this.setState({active: false});
    }.bind(this), ANNOUNCEMENT_HIDE_DELAY);
  },

  render: function() {
    var onClose = function(e) {
      e.preventDefault();
      this.setState({active: false});
    }.bind(this);

    return (
      D.div({className: "Announcement alert " + this.state.className, role: "alert"},
        D.button({type: "button", className: "close", onClick: onClose},
          D.span({className: "glyphicon glyphicon-remove faded"})
        ),
        D.div({className: "content container"},
          this.state.message
        )
      )
    )
  }

}));


WG.Feedback = React.createFactory(React.createClass({

  displayName: 'Feedback',

  getInitialState: function() {
    var LOVE = "Love it!";
    var CONFUSED = "Confused";
    var SKEPTICAL = "Skeptical";
    this.otherValue = "Other...";
    this.levelOneOptions = [LOVE, CONFUSED, SKEPTICAL];
    this.levelTwoOptions = {};
    this.levelTwoOptions[LOVE] = ["Beautiful graphs", "Great data", this.otherValue];
    this.levelTwoOptions[CONFUSED] = ["Confusing graphs", "Unclear data source", "Unclear methodology", this.otherValue];
    this.levelTwoOptions[SKEPTICAL] = ["Result seems wrong", "Data isn't credible", "Not representative", this.otherValue];

    return {
      active: false,
      theme: 'warning',
      levelOneFeedback: undefined,
      levelTwoFeedback: undefined,
      previousFeedbackId: undefined
    }
  },

  componentWillMount: function() {
    var firstTime = !feedbackDB.get() || feedbackDB.get().firstTime;
    if (firstTime) {
      this.trigger = setTimeout(function() {
        this.setState({active: true});
      }.bind(this), DELAY_TO_SHOW_FEEDBACK_BAR);
    }
  },

  componentWillUnmount: function() {
    clearTimeout(this.trigger);
  },

  componentDidUpdate: function(prevProps, prevState) {
    var $this = $(ReactDOM.findDOMNode(this));

    if (this.state.active && !prevState.active) {
      $this.slideDown(200);
      // setTimeout(function() {
      //   this.setState({active: false});
      // }.bind(this), ANNOUNCEMENT_HIDE_DELAY);
    }

    if (!this.state.active && prevState.active) {
      $this.slideUp(200);
    }
  },

  submitFeedback: function(statement) {
    $.post(FEEDBACK_URL, {
        referring_path: document.location.pathname,
        statement: statement,
        parent: this.state.previousFeedbackId
      })
      .done(function(feedback){
        this.setState({
          previousFeedbackId: feedback.id
        });
      }.bind(this))
  },

  addLevelOneFeedback: function(value, e) {
    this.setState({levelOneFeedback: value});
    this.submitFeedback(value);
  },

  addLevelTwoFeedback: function(value, e) {
    if (value == this.otherValue) {
      var customFeedback = prompt("Tell us your thoughts!");
      return this.addLevelTwoFeedback(customFeedback);
    }

    this.setState({levelTwoFeedback: value});
    this.submitFeedback(value);
    // setTimeout(this.close, 3000);
  },

  removeLevelOneFeedback: function() {
    this.setState({
      levelOneFeedback: undefined,
      previousFeedbackId: undefined
    });
  },

  close: function(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    this.setState({active: false});
    feedbackDB.set({firstTime: false});
  },

  renderLevelTwo: function() {
    return (
      D.span({className: "btn-group"},
        this.levelTwoOptions[this.state.levelOneFeedback].map(function(fboption, i) {
          return (
            D.button({
              key: i,
              className: "btn btn-inset btn-" + this.state.theme,
              onClick: this.addLevelTwoFeedback.bind(this, fboption)
            }, fboption)
          )
        }.bind(this)),

        D.button({className: "btn btn-" + this.state.theme,
            onClick: this.removeLevelOneFeedback
          },
          D.span({className: "glyphicon glyphicon-remove faded"})
        )
      )
    )
  },

  render: function() {

    return (
      D.div({className: "Announcement Feedback alert alert-" + this.state.theme, role: "alert"},
        D.button({type: "button", className: "close", onClick: this.close},
          D.span({className: "glyphicon glyphicon-remove faded"})
        ),
        D.div({className: "content container"},
          D.span({className: "left", style: {opacity: 0.75}},
            "Two-Tap Feedback"
          ),
          D.span({className: "glyphicon glyphicon-hand-up"}),
          D.span({className: "glyphicon glyphicon-hand-up left"}),
          this.state.levelOneFeedback != null ?
            (this.state.levelTwoFeedback != null ?
              D.span({},
                "Thank you! 🎉",
                D.button({className: "right btn btn-" + this.state.theme,
                          onClick: this.addLevelTwoFeedback.bind(this, this.otherValue)},
                  "Add a note"
                )
              )
              :
              this.renderLevelTwo()
            )
            :
            D.span({className: "btn-group"},
              this.levelOneOptions.map(function(fboption, i) {
                return (
                  D.button({key: i, className: "btn btn-" + this.state.theme,
                    onClick: this.addLevelOneFeedback.bind(this, fboption)
                  }, fboption)
                )
              }.bind(this))
            )
          
        )
      )
    )
  }

}));

})();
