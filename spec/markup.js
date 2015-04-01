var TestPage = require('./pages/test.page.js');

describe('Marking up a section of text then adding new characters', function() {

  beforeEach(function() {
    var page = new TestPage();
    page.get();
    this.doc = $('.medium-editor-document');
    this.doc.sendKeys("abcdefgh");
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(150);   // Animation fade in
    element.all(by.css('.medium-editor-highlight-menu button')).get(0).click();   // Click 'bold'

    // 'cdef' is now bold
  });

  it('should offset both the start and end markup indices when added before', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('helloab<strong>cdef</strong>gh');
  });

  it('should offset both the start and end markup indices when added at the start of the markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('abhello<strong>cdef</strong>gh');
  });

  it('should offset the end markup index when added in the markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_RIGHT,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>chellodef</strong>gh');
  });

  it('should offset the end markup index when added at the end of the markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_RIGHT,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>cdefhello</strong>gh');
  });

  it('should leave the indices alone when added after the markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>cdef</strong>ghelloh');
  });
});

describe('Marking up a section of text then removing characters', function() {

  beforeEach(function() {
    var page = new TestPage();
    page.get();
    this.doc = $('.medium-editor-document');
    this.doc.sendKeys("abcdefgh");
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(150);   // Animation fade in
    element.all(by.css('.medium-editor-highlight-menu button')).get(0).click();   // Click 'bold'

    // 'cdef' is now bold
  });

  it('should offset both the start and end markup indices when removed before', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('<strong>cdef</strong>gh');
  });

  it('should offset both the start and end markup indices when removed spanning the start', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('a<strong>ef</strong>gh');
  });

  it('should offset the end markup index when removed in the markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>ef</strong>gh');
  });

  it('should offset the end markup index when removed spanning the end of markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>cd</strong>h');
  });

  it('should leave the indices alone when removed after the markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_RIGHT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>cdef</strong>');
  });

  it('should remove the markup when its text is removed', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_RIGHT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      protractor.Key.BACK_SPACE
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('abgh');
  });
});

describe('Marking up a section of text then replacing characters', function() {

  beforeEach(function() {
    var page = new TestPage();
    page.get();
    this.doc = $('.medium-editor-document');
    this.doc.sendKeys("abcdefgh");
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(150);   // Animation fade in
    element.all(by.css('.medium-editor-highlight-menu button')).get(0).click();   // Click 'bold'

    // 'cdef' is now bold
  });

  it('should offset both the start and end markup indices when text is replaced before', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('hello<strong>cdef</strong>gh');
  }),

  it('should offset both the start and end markup indices when replaced spanning the start', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.NULL,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ahello<strong>ef</strong>gh');
  });

  it('should offset the end markup index when replaced in the markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.NULL,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>helloef</strong>gh');
  });

  it('should offset the end markup index when replaced spanning the end of markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.NULL,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>cdhello</strong>h');
  });

  it('should leave the indices alone when replaced after the markup', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_RIGHT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.ARROW_RIGHT,
      protractor.Key.NULL,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('ab<strong>cdef</strong>hello');
  });

  it('should remove the markup when it is entirely replaced', function() {
    this.doc.sendKeys(
      protractor.Key.ARROW_RIGHT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      'hello'
    );
    expect(this.doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('abhellogh');
  });
});
