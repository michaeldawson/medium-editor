var path = require('path');

var TestPage = function() {
  this.get = function() {
    browser.get('spec/test.html');
  };
  this.selectionModel = function() {
    var toReturn = {};
    toReturn.startIx = browser.executeScript('return window.editor._editorView._selection._model._startIx;');
    toReturn.startOffset = browser.executeScript('return window.editor._editorView._selection._model._startOffset;');
    return toReturn;
  };
  this.selectionDOM = function() {
    var toReturn = {};
    toReturn.startNodeValue = browser.executeScript('return window.getSelection().getRangeAt(0).startContainer.nodeValue;');
    toReturn.startOffset = browser.executeScript('return window.getSelection().getRangeAt(0).startOffset;');
    return toReturn;
  };
};

describe('Typing "1. " at the start of a blank paragraph', function() {
  it('should convert it to an ordered list item', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. ");
    expect(doc.all(by.css('p')).count()).toEqual(0);
    expect(doc.all(by.css('ol')).count()).toEqual(1);
    expect(doc.all(by.css('li')).count()).toEqual(1);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Typing "1. " at the start of a paragraph with content', function() {
  it('should convert it to an ordered list item and retain content', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    var testText = "This is a test paragraph";
    doc.sendKeys(testText);
    for(var i = 0; i < testText.length; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys("1. ");

    expect(doc.all(by.css('p')).count()).toEqual(0);
    expect(doc.all(by.css('ol')).count()).toEqual(1);
    expect(doc.all(by.css('li')).count()).toEqual(1);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('This is a test paragraph');
    expect(selectionDOM.startOffset).toEqual(3);
  });
});

describe('Typing "1. " at the start of an ordered list item', function() {
  it('should do nothing special', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. ");
    doc.sendKeys("1. ");

    expect(doc.all(by.css('li')).count()).toEqual(1);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(3);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('1.\u00a0');
    expect(selectionDOM.startOffset).toEqual(3);
  });
});

describe('Typing "1. " at the start of an unordered list item', function() {
  it('should do nothing special', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("* ");
    doc.sendKeys("1. ");

    expect(doc.all(by.css('li')).count()).toEqual(1);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(3);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('1.\u00a0');
    expect(selectionDOM.startOffset).toEqual(3);
  });
});

describe('Typing "1. " at the start of a header', function() {
  it('should do nothing special', function() {

  });
});

describe('Typing "1. " at the start of a blockquote', function() {
  it('should do nothing special', function() {

  });
});

describe('Hitting enter at the end of a list item with content', function() {
  it('should insert a new list item underneath and give it focus', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. test list item");
    doc.sendKeys(protractor.Key.ENTER);

    expect(doc.all(by.css('li')).count()).toEqual(2);
    expect(doc.all(by.css('li')).get(0).getText()).toEqual('test list item');
    expect(doc.all(by.css('li')).get(1).getText()).toEqual('');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting enter at start end of a list item with content', function() {
  it('should insert a new list item above and keep focus on the original', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    var testString = "test list item";
    doc.sendKeys("1. " + testString);
    for(var i = 0; i < testString.length; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.ENTER);

    expect(doc.all(by.css('li')).count()).toEqual(2);
    expect(doc.all(by.css('li')).get(0).getText()).toEqual('');
    expect(doc.all(by.css('li')).get(1).getText()).toEqual(testString);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('test list item');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting enter in the middle of a list item with content', function() {
  it('should split the list item and give focus to the second', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. test list item");
    for(var i = 0; i < 7; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.ENTER);

    expect(doc.all(by.css('li')).count()).toEqual(2);
    expect(doc.all(by.css('li')).get(0).getText()).toEqual('test li');
    expect(doc.all(by.css('li')).get(1).getText()).toEqual('st item');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('st item');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting enter on a blank list item', function() {
  it('should convert it to a paragraph', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. ");
    doc.sendKeys(protractor.Key.ENTER);

    expect(doc.all(by.css('li')).count()).toEqual(0);
    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual('');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting backspace in the middle of a list item', function() {
  it('should do nothing special', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. test list item");
    for(var i = 0; i < 7; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.BACKSPACE);
    expect(doc.all(by.css('li')).count()).toEqual(1);
  });
});

describe('Hitting backspace on an empty list item', function() {
  it('should convert it to a paragraph', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. ");
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('li')).count()).toEqual(0);
    expect(doc.all(by.css('p')).count()).toEqual(1);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting backspace at the start of a list item with content', function() {
  it('should convert it to a paragraph', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');

    doc.sendKeys("1. test item 1");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("test item 2");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("test item 3");
    for(var i = 0; i < "test item 3".length; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.ARROW_UP);
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('li')).count()).toEqual(2);
    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('ol')).count()).toEqual(2);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('test item 2');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Typing "1. " at the start of a blank paragraph underneath an existing ordered list', function() {
  it('should convert it to a list item, part of the ordered list above', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');

    doc.sendKeys("1. test item 1");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("1. test item 2");

    expect(doc.all(by.css('li')).count()).toEqual(2);
    expect(doc.all(by.css('ol')).count()).toEqual(1);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(11);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('test item 2');
    expect(selectionDOM.startOffset).toEqual(11);
  });
});

describe('Backspacing a paragraph up into a list item', function() {
  it('should merge the paragraph text into the list item', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');

    doc.sendKeys("1. test item 1");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("Test paragraph");
    for(var i = 0; i < "Test paragraph".length; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('li')).count()).toEqual(1);
    expect(doc.all(by.css('p')).count()).toEqual(0);
    expect(doc.all(by.css('li')).get(0).getText()).toEqual("test item 1Test paragraph");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(11);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('test item 1Test paragraph');
    expect(selectionDOM.startOffset).toEqual(11);
  });
});

// TODO: *

// TODO: highlight an entire list item and type over
// TODO: highlight an entire list item and backspace
