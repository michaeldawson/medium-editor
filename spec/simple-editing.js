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

describe('Highlighting a range then hitting backspace', function() {
  it('should remove the range and leave the cursor at the front of where it was', function() {

    // Test exists because previously it was
    // removing range THEN backspacing the
    // character before

    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "This is a test paragraph",
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );

    expect(doc.all(by.css('p')).get(0).getText()).toEqual("This is a test paraph");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(19);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("This is a test paraph");
    expect(selectionDOM.startOffset).toEqual(19);
  });
});

describe('Highlighting a range then hitting another key', function() {
  it('should replace the range with the new char (typeover)', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "This is a test paragraph",
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      "c"
    );

    expect(doc.all(by.css('p')).get(0).getText()).toEqual("This is a test paracph");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(20);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("This is a test paracph");
    expect(selectionDOM.startOffset).toEqual(20);
  });
});

describe('Highlighting a range which begins at offset zero then hitting backspace', function() {
  it('should remove the range but leave the block intact and the cursor at offset 0', function() {

    // This test exists because previously, this
    // would cause the block to be merged up into
    // the previous block (because backspace was
    // pressed while selection was at offset zero).

    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "Medium",
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );

    expect(doc.all(by.css('p')).get(0).getText()).toEqual("um");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("um");
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Highlighting an entire block then hitting backspace', function() {
  it('should remove the range but leave the block in place', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "Medium",
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );

    expect(doc.all(by.css('p')).get(0).getText()).toEqual("");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Highlighting over two blocks then hitting backspace', function() {
  it('should remove the selected text and merge the blocks', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("The quick");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("brown fox");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_UP,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );

    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual("The quiox");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(7);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("The quiox");
    expect(selectionDOM.startOffset).toEqual(7);
  });
});

describe('Highlighting over two blocks then hitting another key', function() {
  it('should replace the text with the new key and merge the blocks', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("The quick");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("brown fox");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_UP,
      protractor.Key.NULL,
      'z'
    );

    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual("The quizox");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(8);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("The quizox");
    expect(selectionDOM.startOffset).toEqual(8);
  });
});

describe('Highlighting over two blocks then hitting enter', function() {
  it('should remove the highlighted text from each block', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("The quick");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("brown fox");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_UP,
      protractor.Key.NULL,
      protractor.Key.ENTER
    );

    expect(doc.all(by.css('p')).count()).toEqual(2);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual("The qui");
    expect(doc.all(by.css('p')).get(1).getText()).toEqual("ox");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("ox");
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Highlighting over multiple blocks then hitting backspace', function() {
  it('should remove the highlighted text, merge the start and end blocks and kill the blocks in between', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("The quick");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("brown fox");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("jumped over");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("the lazy dog");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_UP,
      protractor.Key.ARROW_UP,
      protractor.Key.ARROW_UP,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );

    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual("The azy dog");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(4);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("The azy dog");
    expect(selectionDOM.startOffset).toEqual(4);
  });
});

describe('Highlighting entire document then hitting backspace', function() {
  it('should remove the highlighted text and leave a blank paragraph', function() {

    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("Medium");
    doc.sendKeys(
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );

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

// highlighting over two blocks and hitting backspace, where blocks are different types (e.g. p/header)

// highlighting over media or a divider or something else

// if i highlight a range, then click somewhere within that range, the selection model doesn't seem to update
//   hitting enter causes the line break at the last place the cursor was
//   the highlight menu stays active

// TODO - pasting
// TODO - cmd+a
// TODO - copying and pasting via keyboard
// TODO - normal typing updates model
// TODO - fast typing then enter
// TODO - smart quotes

// TODO - dividers - backspacing into a divider kills the divider
// TODO - headers - hitting enter at start or end, new block is a paragraph
