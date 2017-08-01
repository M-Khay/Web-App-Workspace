(function() {

var D = React.DOM;
var LIVE_UPDATE_URL = "/api/v3/responses/recent/";
var SCHOOL_FEED_ICON_URL = "https://d2tyav66cc90rz.cloudfront.net/school_icon_tintable.png";
var LIVE_UPDATE_INTERVAL = 10*1000;
var MAX_COMMENTS = 20;
var MAX_FILTERED_OPTIONS = 5;

WG.Poll = React.createFactory(React.createClass({
  displayName: 'Poll',

  propTypes: {
    poll: React.PropTypes.shape({
      id: React.PropTypes.number.isRequired,
      poll_id: React.PropTypes.number.isRequired,
      question: React.PropTypes.string.isRequired,
      question_picture_url: React.PropTypes.string,
      user: React.PropTypes.shape({
        university_short: React.PropTypes.string
      }).isRequired,
      response: React.PropTypes.object,
      margin_of_error: React.PropTypes.number.isRequired,
      options_filterable: React.PropTypes.bool.isRequired,
      qualified: React.PropTypes.bool.isRequired,
      feed: React.PropTypes.shape({
        name_url: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        image_source: React.PropTypes.string.isRequired,
        category: React.PropTypes.number.isRequired
      })
    }).isRequired,

    theme: React.PropTypes.object,

    showResults: React.PropTypes.bool,
    hideFeedHeader: React.PropTypes.bool,

    // TODO
    showAsCard: React.PropTypes.bool
  },

  isInstance: function() {
    return this.props.poll.id != this.props.poll.poll_id
  },

  getInitialState: function() {
    return {
      optionFilter: "",
      showAll: false
    }
  },

  getDefaultProps: function() {
    return {
      theme: WG.themes.choices.DEFAULT,
      hideFeedHeader: false
    }
  },

  componentDidMount: function() {
    if (this.props.theme.ANIMATE_ON_LOAD && this.props.poll.qualified) {
      var $this = $(ReactDOM.findDOMNode(this));
      $this.hide().slideDown();
    }
  },

  componentDidUpdate: function(prevProps) {
    var $this = $(ReactDOM.findDOMNode(this));
    if (!this.props.poll.qualified && prevProps.poll.qualified) {
      $this.show().slideUp();
    }
    if (this.props.poll.qualified && !prevProps.poll.qualified) {
      $this.hide().slideDown();
    }
  },

  onRender: function(elem) {
    if (!elem) return;
    $(function () {
      $(elem).find('[data-toggle="tooltip"]').tooltip({
        html: true,
        trigger: "click"
      });
    });
  },

  getResponseCount: function() {
    var count = this.props.poll
      .option_counts
      .reduce(function(a, b) { return a + b }, 0);

    return count;
  },

  shouldShowResults: function() {
    if (this.props.showResults || this.props.poll.response != null) {
      return true;
    }

    var user = WG.utils.getUser();
    var forOtherGender = user &&
      this.props.poll.gender != user.gender &&
      user.gender != WG.constants.User.NOT_CHOSEN &&
      this.props.poll.gender != WG.constants.Poll.ALL;
    
    return forOtherGender;
  },

  getPollUrl: function(embeddable) {
    embeddable = embeddable || false;
    var p = this.props.poll;
    var url = window.location.protocol + "//" + window.location.host + "/poll/";

    if (embeddable || !p.feed) {
      url = url + p.poll_id + "/";
    } else {
      url = url + p.feed.name_url + "/" + p.poll_id + "/";
    }

    return url;
  },

  getShareTooltip: function() {
    var url = this.getPollUrl();
    var embeddableUrl = this.getPollUrl(true);
    return "COPY AND SHARE" + "<br/><br/>" +
      url + "<br/><br/>" +
      "OR EMBED" + "<br/><br/>" + 
      "<input type='text' value='&lt;iframe src=\"" + embeddableUrl +
        "\" height=\"450\" width=\"367\" frameborder=\"0\"&gt;&lt;/iframe&gt;' />";
  },

  getCommentTooltip: function() {
    return "See comments on the app" + "<br/><br/>" +
      "<a class='btn btn-transparent' href='" + WG.constants.BRANCH_LINK + "'>Get it</a><br/><br/>" +
      (this.isInstance() ? "" : "*This count combines all schools with the poll.");
  },

  renderBanner: function() {
    var p = this.props.poll;
    var voteTotal = this.getResponseCount();
    var suffix = voteTotal == 1 ? " vote" : " votes";
    var createdDate = moment(p.created_date).fromNow();
    var genderClass = p.gender == 0 ? 'text-blue' :
                      p.gender == 1 ? 'text-pink' : 'text-purple';

    return (
      D.div({className: "banner text-muted"},
        D.span({className: "vote-count " + genderClass},
          D.strong({}, WG.utils.numberWithCommas(voteTotal) + suffix),
          "\u00a0\u00a0",
          WG.MethodologyTooltip({poll: p})
        ),
        p.banner
          ? p.banner + " • "
          : "",
        !p.banner && !p.feed && p.user.university_short
          ? p.user.university_short + " • "
          : "",
        createdDate,
        "\u00a0 • \u00a0",
        D.a({"data-toggle":"tooltip", "data-placement":"top",
              title: this.getCommentTooltip()},
          D.span({className: "glyphicon glyphicon-comment"}),
          "\u00a0\u00a0",
          p.comment_count
        ),
        "\u00a0 • \u00a0",
        D.a({"data-toggle":"tooltip", "data-placement":"top",
             title:this.getShareTooltip()},
          D.span({className: "glyphicon glyphicon-share"})
        )
      )
    )
  },

  renderFeedBanner: function() {
    var p = this.props.poll;
    // FOR TESTING
    // p.user.university_color = "#C4444E";
    // p.user.university_name = "Stanford University";
    var uni_style = p.user.university_color ? {
      borderRadius: 100,
      backgroundColor: p.user.university_color
    } : null;

    return (
      D.p({className: this.props.theme.POLL_BANNER_CLASS },
        p.feed.category == WG.constants.Feed.LOCAL && p.user.university_short
          ? D.span({},
              D.img({style: uni_style, src: SCHOOL_FEED_ICON_URL}),
              D.span({className: "Poll--school" },
                p.user.university_name
              )
            )
          : D.span({},
              D.img({src: p.feed.image_source}),
              p.feed.name
            )
      )
    )
  },

  renderOption: function(option, index) {
    var p = this.props.poll;
    var total = this.getResponseCount() || 1;
    var count = p.option_counts[index];
    var percentage = parseInt(count*100/total);
    var barWidth = this.shouldShowResults() ? percentage : 0;
    var genderClass = p.gender == 0 ? 'bg-blue' :
                      p.gender == 1 ? 'bg-pink' :
                      this.props.theme.OPTION_CLASS;

    var handleOptionSelect = function() {
      // TODO: if wrong gender, still send event to show popup?
      if (!this.shouldShowResults()) {
        PubSub.publish(WG.actions.VOTE_ON_POLL, {
          pollID: p.id,
          response: index
        });
      }
    }.bind(this);

    return (
      D.li({key:index, onClick:handleOptionSelect},
        D.div({className: "inset-shadow"}),
        D.div({className: "option"}, option),
        this.shouldShowResults() ?
          D.div({className: "percentage"},
            p.response && p.response.response == index ?
              D.img({src: this.props.theme.VOTE_MARK_URL})
              : null,
            percentage +"%"
          )
          : null,
        D.div({className: "bar " + genderClass,
               style: {width: barWidth + "%"}})
      )
    )
  },

  renderOptionFilterForm: function() {
    var onChange = function(e) {
      this.setState({
        optionFilter: e.target.value,
        showAll: false
      });
    }.bind(this);

    return (
      D.div({className: "input-group"},
        D.span({className: "input-group-btn"},
          D.button({
              className: "btn btn-default",
              onClick: function() {
                this.setState({optionFilter: this.getInitialState().optionFilter})
              }.bind(this)
            },
            D.span({className: "glyphicon glyphicon-search"})
          )
        ),
        D.input({
          type: "text",
          className: "form-control",
          placeholder: "Filter options...",
          value: this.state.optionFilter,
          onChange: onChange
        })
      )
    )
  },

  render: function() {
    var prefix, genderClass,
        p = this.props.poll;
        
    if (p.gender == 0) {
      prefix = 'Guys:';
      genderClass = 'text-blue';
    } else if (p.gender == 1) {
      prefix = 'Girls:';
      genderClass = 'text-pink';
    } else {
      prefix = '';
      genderClass = '';
    }

    var matchingOptions = p.options;
    if (p.options_filterable && !this.state.showAll) {
      var q = this.state.optionFilter.toLowerCase();
      matchingOptions = matchingOptions.filter(function(option) {
        return option.toLowerCase().indexOf(q) != -1;
      }).slice(
        0, MAX_FILTERED_OPTIONS
      );
    }

    var showAllOptions = function() {
      this.setState({
        optionFilter: this.getInitialState().optionFilter,
        showAll: true
      })
    }.bind(this);

    var style = $.extend({}, this.props.style, {
      display: p.qualified ? undefined : 'none'
    });

    return (
      D.div({className: "Poll clearfix " +
                        (this.shouldShowResults() ? "voted " : ""),
             style: style,
             ref: this.onRender},
        p.feed && !this.props.hideFeedHeader
          ? this.renderFeedBanner()
          : null,

        D.div({className: "question"},
          D.span({className: "prefix " + genderClass}, prefix),
          " " + p.question,
          p.question_picture_url?
            D.div({className: "question"},
              D.img({src: p.question_picture_url})
            )
          : null
        ),

        p.options_filterable ?
          this.renderOptionFilterForm()
          :
          null,

        D.ul({},
          matchingOptions.map(this.renderOption)
        ),

        matchingOptions.length < p.options.length ?
          D.button({className: "btn btn-transparent text-gray faded", onClick: showAllOptions},
            (p.options.length - matchingOptions.length) + " more..."
          )
          :
          null,

        this.renderBanner()
      )
    )
  }
}));


WG.PollList = React.createFactory(React.createClass({

  displayName: 'PollList',

  propTypes: {
    initialPolls: React.PropTypes.arrayOf(React.PropTypes.shape({
      id: React.PropTypes.number.isRequired,
      poll_id: React.PropTypes.number.isRequired,
      gender: React.PropTypes.number.isRequired,
      option_counts: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
      user: React.PropTypes.shape({
        university_short: React.PropTypes.string
      }).isRequired,
    })),

    feed: React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      image_source: React.PropTypes.string.isRequired
    }),

    surveyID: React.PropTypes.number,

    onComplete: React.PropTypes.func,
    onRedirect: React.PropTypes.func,
    onDisqualify: React.PropTypes.func,

    horizontal: React.PropTypes.bool,
    onlyShowPolls: React.PropTypes.bool,
    enableTicker: React.PropTypes.bool,

    showResults: React.PropTypes.bool,

    theme: React.PropTypes.object,
  },

  getInitialState: function() {
    return {
      loading: false,
      polls: this.props.initialPolls || [],
      count: 0,
      isCountEstimated: false,
    }
  },

  componentWillMount: function() {
    this.spinner = new Spinner(WG.constants.SPINNER_SETUP);

    this.listeners = [
      PubSub.subscribe(WG.actions.RENDER_POLLS, function(topic, data) {
        this.setState({
          loading: false,
          polls: data.polls,
          count: data.total_polls || data.total_polls_estimate,
          isCountEstimated: data.total_polls == null &&
            data.total_polls_estimate != null
        })
      }.bind(this)),

      PubSub.subscribe(WG.actions.SHOW_POLL_COUNT, function(topic, data) {
        this.setState({ count: data.total_polls, isCountEstimated: false })
      }.bind(this)),

      PubSub.subscribe(WG.actions.SET_LOADING, function() {
        this.setState({ loading: true })
      }.bind(this)),

      PubSub.subscribe(WG.actions.VOTE_ON_POLL, function(topic, voteData) {
        this.validateAndVote(voteData);
      }.bind(this)),
    ];
  },

  componentWillUnmount: function() {
    this.listeners.map(PubSub.unsubscribe);
    clearInterval(this.liveUpdateInterval);
  },

  componentDidMount: function() {
    this.parentNode = $(ReactDOM.findDOMNode(this)).parent()[0];
    if (this.state.loading) {
      this.spinner.spin(this.parentNode);
    }

    if (this.props.enableTicker) {
      this.lastResponseID = undefined;
      this.liveUpdateInterval = setInterval(this.updateResponseTicker, LIVE_UPDATE_INTERVAL);
    }
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (this.state.loading && !prevState.loading) {
      this.spinner.spin(this.parentNode);
    }
    if (!this.state.loading) {
      this.spinner.stop();
    }
  },

  didQualifyForPolls: function(newPolls) {
    // TODO insert them instead of checking existing list
    var ids = newPolls.map(function(p){return p.id});
    var polls = this.state.polls.map(function(pi, index) {
      if (ids.indexOf(pi.poll_id) != -1) {
        pi = $.extend({}, pi, {
          qualified: true
        });
      }
      return pi;
    });
    this.setState({polls: polls});
  },

  responseComparator: function(a, b) {
    // Bring uni connected users first
    if (a.user.university_short && !b.user.university_short) {
      return -1;
    }
    if (!a.user.university_short && b.user.university_short) {
      return 1;
    }
    return 0;
  },

  updateResponseTicker: function() {
    $.get(LIVE_UPDATE_URL, {last_response_id: this.lastResponseID}, function(responses) {
      if (responses.length <= 1) {
        return;
      }
      responses.sort(this.responseComparator);
      var lastResponse = responses[0];
      this.lastResponseID = lastResponse.id;
      var handle = lastResponse.user.handle.replace(" (", " (student at ");
      var message = handle + " and " + (responses.length - 1) +
        " others just voted on a poll!";
      PubSub.publish(WG.actions.SHOW_INFO, message);
    }.bind(this));
  },

  // filterUnique: function(polls) {
  //   return polls.filter(function onlyUnique(poll_instance, i, self) {

  //     var this_poll = poll_instance.poll_id,
  //         this_uni = poll_instance.user.university_short;

  //     var foundIndex = -1;
  //     self.some(function firstPollAtUni(pi, j) {
  //       if (pi.poll_id == this_poll &&
  //           pi.user.university_short == this_uni) {
  //         foundIndex = j;
  //         return true;
  //       }
  //       return false;
  //     });

  //     return i == foundIndex;
  //   });
  // },

  validateAndVote: function(voteData) {
    PubSub.unsubscribe(this._userValidationWall);
    var user = WG.utils.getUser();

    // Check signed in
    if (!user) {
      PubSub.publish(WG.actions.CREATE_USER);
      this._userValidationWall = PubSub.subscribe(
        WG.actions.STORED_USER,
        this.validateAndVote.bind(this, voteData)
      );
      return;
    }

    var poll = this.state.polls.filter(function(p){
      return p.id == voteData.pollID;
    })[0];
    if (!poll) {
      // It's in another list on the page
      return;
    }

    // Check gender
    if (poll.gender != WG.constants.Poll.ALL &&
        user.gender != poll.gender) {

      if (user.gender == WG.constants.User.NOT_CHOSEN) {
        PubSub.publish(WG.actions.UPDATE_USER);
        this._userValidationWall = PubSub.subscribe(
          WG.actions.STORED_USER,
          this.validateAndVote.bind(this, voteData)
        );
      } else {

        var shouldAlert = true;

        if (this.props.onDisqualify) {
          shouldAlert = this.props.onDisqualify();
        }

        if (shouldAlert) {
          alert("Oops, that poll is for the other gender 💁. We'll show you the results though.");
          this.forceUpdate();
        }
      }
      return;
    }

    // Check email
    // if (poll.)

    // We're valid!
    var body = {
      response: voteData.response,
      survey_id: this.props.surveyID
    };
    if (user.location) {
      $.extend(body, {
        latitude: user.location.latitude,
        longitude: user.location.longitude
      });
    }
    poll.response = body; // TODO persist this in state
    poll.option_counts[voteData.response] += 1;
    this.forceUpdate();
    // Save to server
    $.ajax({
      url: '/poll/' + poll.poll_id + "/response/new/",
      dataType: 'json',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(body)
    })
    .done(function(data) {
      if (data.user) {
        PubSub.publish(WG.actions.STORE_USER, data.user);
      }
      if (data.qualified_polls) {
        setTimeout(
          this.didQualifyForPolls.bind(this, data.qualified_polls),
          200
        );
      }
      if (data.did_complete) {
        setTimeout(
          this.props.onComplete,
          500
        );
      }
      if (data.redirect_url) {
        setTimeout(
          this.props.onRedirect.bind(this, data.redirect_url),
          1500
        );
      }
    }.bind(this))
    .fail(function(jqXHR) {
      // Forbidden or unauthorized
      if (jqXHR.status == 403 || jqXHR.status == 401) {
        WG.utils.resetUser();
        // Try again
        this.validateAndVote(voteData);
      }
    }.bind(this));
  },

  renderStats: function() {
    var loggedIn = WG.utils.getUser();
    var attrs = {
      className: "text-muted",
      style: {
        textAlign: loggedIn ? "left" : "center",
        marginTop: loggedIn ? 0 : 50,
        transition: "all 0.2s ease",
        opacity: this.state.loading ? 0 : 1
      }
    };

    // Render an empty space if there's no count data
    if (!this.state.count) {
      var actionText = WG.utils.isMobile() ? "Tap" : "Click";
      return D.p(attrs,
        D.small({},
          loggedIn ? "\u00a0" : actionText + " on a grey box to see results"
        )
      );
    }

    var count,
        units,
        estimation = "";

    if (this.state.count > this.state.polls.length) {
      count = this.state.count;
      estimation = " about";
    } else {
      count = this.state.polls.length;
      estimation = " at least";
    }
    units = count == 1 ? "poll" : "polls";

    if (!this.state.isCountEstimated) {
      estimation = "";
    }

    return D.p(attrs,
        D.small({}, "Found" + estimation + " " + count.toLocaleString() +
                    " " + units
      )
    )
  },

  renderFeedHeader: function() {
    
    return (
      D.h1({className: this.props.theme.POLL_BANNER_CLASS },
        D.img({src: this.props.feed.image_source}),
        this.props.feed.name
      )
    )
  },

  renderPlaceholder: function() {
    return D.h5({className: "text-white text-center"},
      "No polls left here"
    )
  },
  
  render: function() {
    // Can't display relative; need to allow tooltip overflow
    var style = {
      opacity: this.state.loading ? 0.5 : 1
    };
    var pollStyle = {};

    if (this.props.horizontal) {
      $.extend(style, {
        width: "auto",
        whiteSpace: "nowrap",
        overflowX: "auto"
      });
      pollStyle = {
        width: 330,
        // maxHeight: 330,
        marginRight: 10,
        display: "inline-block",
        verticalAlign: "top",
        overflowY: "auto"
      };
    }

    var qualifiedPolls = this.state.polls.filter(function(p) {
      return p.qualified;
    });

    return (
      D.div({ className: "PollList row", style: style },

        this.props.feed
          ? this.renderFeedHeader()
          : null,

        this.props.onlyShowPolls
          ? null
          : this.renderStats(),

        qualifiedPolls.map(function(poll) {
          return WG.Poll({
            ref: "poll_" + poll.id,
            poll: poll,
            key: poll.id,
            style: pollStyle,
            showAsCard: this.props.onlyShowPolls,
            theme: this.props.theme,
            showResults: this.props.showResults,
            hideFeedHeader: !!this.props.feed
          })
        }.bind(this)),

        qualifiedPolls.length
          ? null
          : this.renderPlaceholder(),

        this.props.onlyShowPolls
          ? null
          : WG.PollListFooter(this.props)
      )
    )
  }
}));

WG.PollListFooter = React.createFactory(React.createClass({

  displayName: 'PollListFooter',

  propTypes: {
    theme: React.PropTypes.object
  },

  getDefaultProps: function() {
    return {
      theme: WG.themes.choices.DEFAULT
    }
  },

  componentWillMount: function() {
    this.listeners = [
      PubSub.subscribe(WG.actions.STORED_USER, function(topic) {
        this.forceUpdate();
      }.bind(this)),
    ];
  },

  componentWillUnmount: function() {
    this.listeners.map(PubSub.unsubscribe);
  },

  render: function() {
    var user = WG.utils.getUser();
    var pointSuffix = "";
    if (user) {
      pointSuffix = user.karma == 1 ? " point!" : " points!";
    }

    var wellClass = this.props.theme.FOOTER_CLASS;
    if (user) {
      wellClass += [" bg-blue", " bg-pink"][user.gender] || "";
    }

    return (
      D.div({ className: "well well-lg text-center " + wellClass },
        D.p({},
          "Everyone's opinion in your pocket. See more on the app, for both iPhone and Android!",
          user && user.karma > 0 ?
            D.small({className: "text-muted"},
              D.br(),
              "You already have an account with " + user.karma + pointSuffix
            )
            : null
        ),
        D.a({className: "btn btn-transparent btn-lg",
             href: WG.constants.BRANCH_LINK},
          "Get the app"
        )
      )
    )
  },
}));

WG.CommentList = React.createFactory(React.createClass({
  displayName: 'CommentList',

  propTypes: {
    initialComments: React.PropTypes.arrayOf(React.PropTypes.shape({
      text: React.PropTypes.string.isRequired,
      user: React.PropTypes.shape({
          university_name: React.PropTypes.string.isRequired,
        }).isRequired,
      created_date: React.PropTypes.string.isRequired,
    })),
    survey: React.PropTypes.shape({
      id: React.PropTypes.number
    })
  },

  getInitialState: function () {
    return {
      comments: this.props.initialComments || []
    }
  },

  componentWillMount: function() {
    this.spinner = new Spinner(WG.constants.SPINNER_SETUP);
  },

  componentDidMount: function() {
    this.spinnerNode = ReactDOM.findDOMNode(this);
    if (this.state.loading) {
      this.spinner.spin(this.spinnerNode);
    }
    if (this.props.survey) {
      this.fetchComments();
    }
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (this.state.loading && !prevState.loading) {
      this.spinner.spin(this.spinnerNode);
    }
    if (!this.state.loading) {
      this.spinner.stop();
    }
  },

  fetchComments: function() {
    this.setState({loading: true});

    if (this.xhr) {
      this.xhr.abort();
    }

    this.xhr = $.getJSON("/survey/" + this.props.survey.id + "/comments/")
      .done(function(data) {
          this.setState({comments: data})
        }.bind(this))
      .fail(function(data) {
          PubSub.publish(WG.actions.SHOW_ERROR, "Failed to load comments: " + data.responseText);
        }.bind(this))
      .always(function(data) {
          this.setState({
            loading: false
          });
        }.bind(this));
  },

  renderComment: function(comment, index) {
    var handleClass = ["text-blue", "text-pink"][comment.user.gender] || "text-purple";
    var handle = ["Male Respondent", "Female Respondent"][comment.user.gender] || "Anonymous";
    if (comment.user.university_name) {
      handle = handle + " (" + comment.user.university_name + ")";
    }
    var profileURL = "/dashboard/profiles/" + comment.user.id;
    var commentStyle = {
      width: 250,
      float: "left",
      backgroundColor: "white",
      borderRadius: 3,
      padding: 10,
      marginBottom: 10,
      marginRight: 10
    };
    return (
      D.div({key: comment.id, style: commentStyle},
        D.a({
            className: handleClass,
            href: profileURL,
            target: "_blank"
          },
          D.strong({}, handle)
        ),
        D.div({}, comment.text),
        D.div({className: "text-muted"},
          D.small({}, moment(comment.created_date).fromNow())
        )
      )
    )
  },

  render: function() {
    var style = {
      position: 'relative',
      backgroundColor: "rgb(250, 252, 255)",
      padding: 15,
      paddingBottom: 5,
      marginBottom: 15
    };
    return (
      D.div({className: "clearfix", style: style},
        this.state.comments.length ?
          this.state.comments.slice(0, MAX_COMMENTS).map(this.renderComment)
          :
          D.p({}, "No comments yet! Download the app to comment"),

        this.state.comments.length > MAX_COMMENTS ?
          D.h4({style: {clear: "both"}, className: "text-right"},
            "Showing " + MAX_COMMENTS + " out of " + this.state.comments.length
          )
          : null
      )
    )
  }

}));

})();
