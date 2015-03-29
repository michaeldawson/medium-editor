var path = require('path');

var TestPage = function() {
  this.get = function() {
    browser.get('spec/pages/test.page.html');
  };
  this.selectionModel = function() {
    var toReturn = {};
    toReturn.startIx = browser.executeScript('return window.editor._editorView._selection._model._startIx;');
    toReturn.startOffset = browser.executeScript('return window.editor._editorView._selection._model._startOffset;');
    toReturn.endIx = browser.executeScript('return window.editor._editorView._selection._model._endIx;');
    toReturn.endOffset = browser.executeScript('return window.editor._editorView._selection._model._endOffset;');
    toReturn.isCaret = browser.executeScript('return window.editor._editorView._selection._model.isCaret();');
    return toReturn;
  };
  this.selectionDOM = function() {
    var toReturn = {};
    toReturn.startNodeValue = browser.executeScript('return window.getSelection().getRangeAt(0).startContainer.nodeValue;');
    toReturn.startOffset = browser.executeScript('return window.getSelection().getRangeAt(0).startOffset;');
    toReturn.endNodeValue = browser.executeScript('return window.getSelection().getRangeAt(0).endContainer.nodeValue;');
    toReturn.endOffset = browser.executeScript('return window.getSelection().getRangeAt(0).endOffset;');
    return toReturn;
  };
};

module.exports = TestPage;
