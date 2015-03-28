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

describe('Hitting enter in the middle of a paragraph', function() {
  it('should split the paragraph in two and give focus to the second', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");
    for(var i = 0; i < 5; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.ENTER);
    var paragraphs = doc.all(by.css('p'));
    expect(paragraphs.count()).toEqual(2);
    expect(paragraphs.get(0).getText()).toEqual('This is a test para');
    expect(paragraphs.get(1).getText()).toEqual('graph');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('graph');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting enter at the end of a paragraph', function() {
  it('should create a new paragraph underneath and give it focus', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");
    doc.sendKeys(protractor.Key.ENTER);
    var paragraphs = doc.all(by.css('p'));
    expect(paragraphs.count()).toEqual(2);
    expect(paragraphs.get(0).getText()).toEqual('This is a test paragraph');
    expect(paragraphs.get(1).getText()).toEqual('');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting enter at the start of a paragraph', function() {
  it('should create a new paragraph above and leave focus on the original', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    var testString = "This is a test paragraph";
    doc.sendKeys(testString);
    for(var i = 0; i < testString.length; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.ENTER);
    var paragraphs = doc.all(by.css('p'));
    expect(paragraphs.count()).toEqual(2);
    expect(paragraphs.get(0).getText()).toEqual('');
    expect(paragraphs.get(1).getText()).toEqual(testString);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(testString);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting backspace in the middle of a paragraph', function() {
  it('should backspace normally', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");
    for(var i = 0; i < 12; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.element(by.css('p')).getText()).toEqual("This is a tst paragraph");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(11);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("This is a tst paragraph");
    expect(selectionDOM.startOffset).toEqual(11);
  });
});

describe('Hitting backspace at the start of a paragraph', function() {
  it('should merge the current paragraph up into the previous one', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("This is also a test paragraph");

    for(var i = 0; i < "This is also a test paragraph".length; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual("This is a test paragraphThis is also a test paragraph");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(24);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("This is a test paragraphThis is also a test paragraph");
    expect(selectionDOM.startOffset).toEqual(24);
  });
});

describe('Hitting backspace at the start of the first paragraph in the document', function() {
  it('should do nothing', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");
    for(var i = 0; i < "This is a test paragraph".length; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual("This is a test paragraph");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("This is a test paragraph");
    expect(selectionDOM.startOffset).toEqual(0);

  });
});

// TODO - pasting
// TODO - typeover
// TODO - normal typing updates model

// TODO - dividers - backspacing into a divider kills the divider
// TODO - headers - hitting enter at start or end, new block is a paragraph
