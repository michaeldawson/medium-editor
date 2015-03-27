// ------------------------------------------------
//  Model-DOM Mapper
// ------------------------------------------------
//  Responsible for mapping from model space to
//  DOM space (HTML) and vice-versa.
// ------------------------------------------------

MediumEditor.ModelDOMMapper = {

  // ----------------------------------------------
  //  Instance Methods
  // ----------------------------------------------

  parseHTMLIntoBlockCollection: function(attrs) {
    var toReturn = new MediumEditor.BlockCollection({ model: attrs.document });
    var el = document.createElement('div');
    el.innerHTML = attrs.html.trim();
    for(var i = 0; i < el.children.length; i++) {
      var node = el.children[i];
      toReturn.add(this._parseNodeIntoBlock(node));
    }
    return toReturn;
  },

  _parseNodeIntoBlock: function(node) {

    // Determine the type from the tag name
    var attrs = { text: node.innerText };
    var tagName = node.tagName.toLowerCase();
    switch(tagName) {
      case 'p':           attrs['type'] = 'PARAGRAPH'; break;
      case 'blockquote':  attrs['type'] = 'QUOTE'; break;
      case 'h2':          attrs['type'] = 'HEADING1'; break;
      case 'h3':          attrs['type'] = 'HEADING2'; break;
      case 'h4':          attrs['type'] = 'HEADING3'; break;
      case 'hr':          attrs['type'] = 'DIVIDER'; break;
      case 'figure':
        attrs['type'] = node.children[0].tagName.toLowerCase() == 'img' ? 'IMAGE' : 'VIDEO';
        attrs['metadata'] = {};
        attrs['metadata']['src'] = node.children[0].src;
        if (node.children.length > 1) attrs['metadata']['caption'] = node.children[1].innerText;
        break;
      case 'li':
        // TODO
        break;
    }
    return new MediumEditor.BlockModel(attrs);
  },

  // Given a model, produce the HTML representation
  // as a string. Takes block models or document.
  toHTML: function(model) {

    if (model instanceof MediumEditor.BlockModel) {

      // Wrap the inner HTML
      var tag;
      switch(true) {
        case model.isParagraph():             tag = 'p'; break;
        case model.isQuote():                 tag = 'blockquote'; break;
        case model.isHeading1():              tag = 'h2'; break;
        case model.isHeading2():              tag = 'h3'; break;
        case model.isHeading3():              tag = 'h4'; break;
        case model.isImage():                 tag = 'figure'; break;
        case model.isVideo():                 tag = 'figure'; break;
        case model.isOrderedListItem():       tag = 'li'; break;
        case model.isUnorderedListItem():     tag = 'li'; break;
        case model.isDivider():               tag = 'div'; break;     // Inner HTML is a hr, but we wrap it in a div so it can't be selected
      }

      var openingTag = "<" + tag + ( !model.isText() ? ' contenteditable="false"' : '' ) + ">";
      var closingTag = "</" + tag + ">";
      var html = openingTag + this.innerHTML(model) + closingTag;
      return html;

    } else if (model instanceof MediumEditor.DocumentModel) {

      // Document model.
      var blocks = model.blocks();
      var toReturn = "";
      for(var i = 0; i < blocks.size(); i++) {

        // Grab handles the previous, current and
        // next blocks
        var prevBlock = i > 0 ? blocks.at(i - 1) : null;
        var currentBlock = blocks.at(i);
        var nextBlock = i < (blocks.size() - 1) ? blocks.at(i + 1) : null;

        // If this block has a different layout to
        // the last, or is the first block, open
        // the new layout
        if (prevBlock == null || prevBlock.layout() != currentBlock.layout()) {
          var layoutClass = currentBlock.layout();
          layoutClass = layoutClass || "single-column";
          toReturn += "<div class='layout-" + layoutClass + "'>";
        }

        // If this block is a list item and the
        // last block was not, open the list
        if (currentBlock.isListItem()) {
          if (prevBlock == null || prevBlock.type() != currentBlock.type()) {
            toReturn += "<" + (currentBlock.isOrderedListItem() ? "ol" : "ul") + ">";
          }
        }

        // Add the block HTML
        toReturn += this.toHTML(blocks.at(i));

        // If this block is a list item and the
        // next block is not, close the list.
        if (currentBlock.isListItem()) {
          if (nextBlock == null || nextBlock.type() != currentBlock.type()) {
            toReturn += "</" + (currentBlock.isOrderedListItem() ? "ol" : "ul") + ">";
          }
        }

        // If this block has a different layout to
        // the next, close the layout
        if (nextBlock == null || nextBlock.layout() != currentBlock.layout()) {
          toReturn += "</div>";
        }
      }
      return toReturn;
    }

  },

  // Returns the inner HTML of a given block as a
  // string. This is separated from the `outerHTML`
  // method because when re-rendering views upon
  // content change, we only want the inner HTML.
  innerHTML: function(model) {

    if (model.isText()) {

      // Paragraph, heading, quote etc. Markup the
      // text
      var innerHTML = this.markup(model) || '<br>';

      // Spaces need to be converted to nbsp if
      // they're consecutive, or appear at the
      // beginning or end of the string
      return innerHTML.replace(/\s{2}/g,' &nbsp;')     // Consecutive spaces should be compressed to a space + nbsp
                      .replace(/^ /,'&nbsp;')          // Leading spaces should be nbsp
                      .replace(/ $/,'&nbsp;')          // Trailing spaces should be nbsp

    } else if (model.isMedia()) {

      // Images or videos. The actual img or iframe
      // element will be nested within a figure.
      var innerHTML;
      if (model.isImage()) {
        innerHTML = "<img src='" + model.metadata()['src'] + "'>";
      } else {
        innerHTML = "<iframe frameborder='0' allowfullscreen src='" + model.metadata()['src'] + "'>";
      }

      // Add the caption (if it exists)
      if (model.metadata()['caption']) {
        innerHTML += "<figcaption contenteditable='true'>" + model.metadata()['caption'] + "</figcaption>";
      }

      return innerHTML;

    } else {

      // Divider
      return "<hr>";
    }
  },

  // Given a block model, apply all of its markups
  // and return the resulting HTML string.
  //
  // Note, we need to ensure precedence here. For
  // example, if a strong an an emphasis both start
  // at the same offset, we should return
  // '<strong><em> ...' rather than
  // '<em><strong> ...'.
  //
  // We also need to consider that markups of
  // different types in the collection can overlap
  // each other, but the produced HTML needs to
  // respect nesting rules.e.g.:
  //
  //   <strong>hi<em></strong>there</em>   <-- invalid
  markup: function(model) {

    // If there are no markups to apply, just
    // return the plain text
    var text = model.text();
    var markups = model.markups();
    if (markups.size() == 0) return text;

    // For each item in the markup array, create an
    // 'inject' - an object representing an
    // instance where we need to inject some HTML
    // into the string. Each markup has two
    // injects - one for the opening and one for
    // the closing.
    var injects = [];
    for (var i = 0; i < markups.size(); i++) {
      var markup = markups.at(i);
      injects.push({ type: 'open', at: markup.start, obj: markup });
      injects.push({ type: 'close', at: markup.end, obj: markup });
    }

    // Sort the injects by the index they occur at,
    // then by the type, then finally by the tag
    // string
    injects.sort(function(a,b) {
      if (a.at != b.at) {
        return a.at - b.at;     // Sort by offset first
      } else {

        // Then by close ahead of open
        if (a.type[0] != b.type[0]) {
          return this._charComparison(a.type[0], b.type[0]);
        } else {

          // Then by the tag name
          var order = a.type == 'open' ? 1 : -1;                                    // Reverse order for closing tags
          return this._charComparison(a.obj.tag[0], b.obj.tag[0]) * order;
        }
      }
    });

    var toReturn = '';
    var textIx = 0;

    // Go through the injects, keeping track of all
    // the open tags
    var openTags = [];
    for (var i = 0; i < injects.length; i++) {
      var inject = injects[i];

      // Add the text up to this point and update
      // the text index
      toReturn += text.substring(textIx, inject.at);
      textIx = inject.at;

      if (inject.type == 'open') {

        // Tag opening
        toReturn += inject.obj.openingTag();
        openTags.push(inject);

      } else {

        // Tag closing. Grab all the open tags
        // which end after this one.
        var temp = [];
        var c;
        while((c = openTags.pop()).tag != inject.tag) {
          temp.push(c);
        }

        // Close the other tags first
        for (var j = 0; j < temp.length; j++) {
          toReturn += temp[j].obj.closingTag();
        }

        // Now close this tag
        toReturn += inject.obj.closingTag();

        // Now put the other tags back
        while(temp.length) openTags.push(temp.pop());
      }
    }

    // Grab any remaining characters
    toReturn += text.substring(textIx);
    return toReturn;
  },

  // Helper utility to compare two characters
  _charComparison: function(a,b) {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      return 0;
    }
  }

};
