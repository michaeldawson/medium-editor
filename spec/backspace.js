var TestPage = require('./pages/test.page.js');

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

    browser.manage().logs().get('browser').then(function(browserLogs) {
      browserLogs.forEach(function(log){
        console.log(log.message);
      });
    });

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(7);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("The quiox");
    expect(selectionDOM.startOffset).toEqual(7);
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

describe('Backspacing a non-paragraph block with content up into a blank paragraph', function() {
  it('should retain its type', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      protractor.Key.SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.ENTER,
      "hello",
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(250);   // Animation fade in
    element.all(by.css('.medium-editor-highlight-menu button')).get(2).click();   // Convert to Heading1
    doc.sendKeys(protractor.Key.ARROW_LEFT);
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('p')).count()).toEqual(0);
    expect(doc.all(by.css('h2')).count()).toEqual(1);
    expect(doc.all(by.css('h2')).get(0).getText()).toEqual('hello');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('hello');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Paragraph-highlighting then hitting backspace', function() {
  it('should clear the paragraph', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("Test paragraph");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("Another test paragraph");
    doc.sendKeys(protractor.Key.ARROW_UP);
    for(var i = 0; i < 14; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(
      protractor.Key.SHIFT,
      protractor.Key.ARROW_DOWN,
      protractor.Key.NULL
    );
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('p')).count()).toEqual(2);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual('');
    expect(doc.all(by.css('p')).get(1).getText()).toEqual('Another test paragraph');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Highlighting over multiple list items and hitting backspace', function() {
  it('should merge the first and last list item in the selection', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. The quick");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("brown fox");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("jumped over");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_UP,
      protractor.Key.ARROW_UP,
      protractor.Key.NULL
    );
    doc.sendKeys(protractor.Key.BACK_SPACE);

    expect(doc.all(by.css('li')).count()).toEqual(1);
    expect(doc.all(by.css('li')).get(0).getText()).toEqual('The qud over');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(6);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('The qud over');
    expect(selectionDOM.startOffset).toEqual(6);
  });
});

// TODO - highlighting over two blocks and hitting backspace, where blocks are different types (e.g. p/header)
// TODO - highlighting multiple blocks where one is an image or divider then hitting backspace
