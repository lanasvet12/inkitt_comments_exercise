// var _ = require('underscore');

var React = require('react');
var $ = require('jquery');
var marked = require('marked');

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

    $('#infoDiv').css('display', 'block');
    $('#infoDiv').css('position', 'absolute');
    $('#infoDiv').css('left', event.clientX + 10);
    $('#infoDiv').css('top', event.clientY + 15);
  } else {
    $('#infoDiv').css('display', 'none');
  }
}

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
        <Comment comment = {comment} onDelete = {this.handleDelete} index = {index} key = {index} author={comment.author}>
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
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    React.findDOMNode(this.refs.author).value = '';
    React.findDOMNode(this.refs.text).value = '';
    return;
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input type="text" placeholder="Your name" ref="author" />
        <input type="text" placeholder="Say something..." ref="text" />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

React.render(
  <CommentBox url="comments.json" pollInterval={2000} />,
  document.getElementById('comments')
);