// var _ = require('underscore');

var React = require('react');
var $ = require('jquery');
var marked = require('marked');
var findAndReplaceDOMText = require('findandreplacedomtext');

window.onload = function () {
};

function getSelectionText() {
  var text = "";
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != "Control") {
    text = document.selection.createRange().text;
  }
  return text;
}

function getSelectedText() {
  var text = "";
  if (typeof window.getSelection != "undefined") {
    text = window.getSelection().toString();
  } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
    text = document.selection.createRange().text;
  }
  return text;
}

function doSomethingWithSelectedText() {
  var selectedText = getSelectedText();
  if (selectedText) {
    // window.alert(selectedText);
    var sel = window.getSelection ? window.getSelection() : document.selection.createRange();
    var range = sel.getRangeAt(0);
    console.log(sel);
    console.log(range);

    var ancestor = range.commonAncestorContainer;
    while (ancestor.id != "content" // Check id, class or otherwise
           && ancestor.parentElement !== null) {
        ancestor = ancestor.parentElement;
    }

    if (ancestor.id == "content") {
      // console.log(ancestor.id);
      $('.tooltipDiv').css('display', 'block');
      $('.tooltipDiv').css('position', 'absolute');
      $('.tooltipDiv').css('left', window.scrollX + event.clientX + 10);
      $('.tooltipDiv').css('top', window.scrollY + event.clientY - 16);
    } else {
      $('.tooltipDiv').css('display', 'none');
    }
  } else {
    $('.tooltipDiv').css('display', 'none');
  }
};

document.onmouseup = doSomethingWithSelectedText;
document.onkeyup = doSomethingWithSelectedText;

// ********** REACT

var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  deleteComment: function(commentIndex){
    var comments = this.state.data;

    // These 2 lines just to refresh faster: i.e without waiting for server response.
    var newComments = comments.splice(commentIndex, 1);
    this.setState({data: newComments});

    $.ajax({
      url: this.props.url,
      port: 3000,
      type: 'DELETE',
      dataType: 'json',
      data: {"index" : commentIndex},
      success: function (comments) {
        this.setState({data: comments});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="commentBox">
        <div className="notesHeader">Notes</div>
        <hr className="hairline" />
        <CommentList deleteElement = {this.deleteComment} data={this.state.data} />
        <hr className="hairline" />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

var Comment = React.createClass({
  handleClick: function(e){
    e.preventDefault();
    var commentIndex = this.props.index;
    return this.props.onDelete(commentIndex);
  },
  render: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    var stringSelectedText = this.props.selectedText;
    console.log(stringSelectedText);
    var regexSelectedText = "/" + stringSelectedText + "/"
    console.log(regexSelectedText);
    var re = new RegExp(stringSelectedText, "");
    console.log(re);
    if (stringSelectedText !== "") {
      findAndReplaceDOMText(document.getElementById('content'), {
        find: re,
        wrap: 'em'
      });
    };
    return (
      <div className="comment">
        <span className="deletebutton">
          <a href="#" onClick={this.handleClick}>delete</a>
        </span>
        <span className="commentAuthor">
          {this.props.author}
        </span>
        <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
      </div>
    );
  }
});

var CommentList = React.createClass({
  handleDelete: function(commentIndex){
      return this.props.deleteElement(commentIndex);
    },
  render: function() {
    var commentNodes = this.props.data.map(function (comment, index) {
      return (
        <Comment comment = {comment} onDelete = {this.handleDelete} index = {index} key = {index} author={comment.author} selectedText={comment.selectedText} >
          {comment.text}
        </Comment>
      );
    }.bind(this));
    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});

var CommentForm = React.createClass({
  handleSubmit: function(e) {
    e.preventDefault();
    var author = React.findDOMNode(this.refs.author).value.trim();
    var text = React.findDOMNode(this.refs.text).value.trim();
    var selectedText = React.findDOMNode(this.refs.selectedText).value.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({selectedText: selectedText, author: author, text: text});
    React.findDOMNode(this.refs.author).value = '';
    React.findDOMNode(this.refs.text).value = '';
    React.findDOMNode(this.refs.selectedText).value = '';
    return;
  },

  handleClickComment: function() {
    // Explicitly focus the text input using the raw DOM API.
    React.findDOMNode(this.refs.author).focus();
    $('.tooltipDiv').css('display', 'none');
    // console.log("handling click")
  },

  handleClickHighlight: function() {
    var highlighted = getSelectedText();
    console.log(highlighted);
    // this.setState({highlightedText: highlighted});
    
    React.findDOMNode(this.refs.selectedText).value = highlighted;
    // Explicitly focus the text input using the raw DOM API.
    React.findDOMNode(this.refs.author).focus();
    $('.tooltipDiv').css('display', 'none');
    // console.log("handling click")
  },

  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <span className="formHeader">Leave a comment!</span>
        <input className="textInput" type="text" placeholder="Your name" ref="author" />
        <input className="textInput" type="textbox" placeholder="Say something..." ref="text" />
        <div id="hiddenText">
          <input type="text" placeholder="" tabIndex="-1" ref="selectedText" />
        </div>
        <input className="submitButton" type="submit" value="Post" />

        <div className="tooltipDiv">
          <input
            type="button"
            value="Comment"
            onClick={this.handleClickComment}
          />
          <input
            type="button"
            value="Highlight"
            onClick={this.handleClickHighlight}
          />
        </div>
      </form>
    );
  }
});

// <FocusBox placeholder="Your name" ref="author" />
// <FocusBox placeholder="Say something..." ref="text" />


var FocusBox = React.createClass({
  getInitialState: function() {
    return {
      focused: false
    };
  },
      
  focus: function() {
    this.setState({ focused: true });
  },
        
  blur: function() {
    this.setState({ focused: false });
  },
      
  render: function() {
    return <div className={"focus-box" + (this.state.focused ? " focus" : "") + (this.props.error ? " error" : "")}>
      <div>
        <input type="text" placeholder={this.props.placeholder} ref={this.props.ref} onFocus={this.focus} onBlur={this.blur} />
        <div className="focus">
          <div></div>
        </div>
      </div>
    </div>;
  }
});

var ToolTip = React.createClass({
  handleClick: function() {
    // Explicitly focus the text input using the raw DOM API.
    React.findDOMNode(this.refs.author).focus();
  },
  render: function() {
    // The ref attribute adds a reference to the component to
    // this.refs when the component is mounted.
    return (
      <div className="tooltipDav">
        <input
          type="button"
          value="Focus the text input"
          onClick={this.handleClick}
        />
      </div>
    );
  }
});

React.render(
  <CommentBox url="comments.json" pollInterval={2000} />,
  document.getElementById('comments')
);