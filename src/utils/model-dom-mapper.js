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
      var child = el.children[i];
      var layout = child.className.substring(7).toUpperCase();
      for(var j = 0; j < child.children.length; j++) {
        var grandchild = child.children[j];
        var tagName = grandchild.tagName.toLowerCase();
        if (tagName == 'ol' || tagName == 'ul') {
          for(var k = 0; k < grandchild.children.length; k++) {
            var greatGrandchild = grandchild.children[k];
            toReturn.add(this._parseNodeIntoBlock(greatGrandchild, layout));
          }
        } else {
          toReturn.add(this._parseNodeIntoBlock(grandchild, layout));
        }
      }
    }
    return toReturn;
  },

  _parseNodeIntoBlock: function(node, layout) {

    // Determine the type from the tag name
    layout = node.className || layout;
    var attrs = { text: node.innerText, layout: layout };
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
        attrs['type'] = node.parentNode.tagName.toLowerCase() == 'ol' ? 'ORDERED_LIST_ITEM' : 'UNORDERED_LIST_ITEM';
        break;
    }
    return new MediumEditor.BlockModel(attrs);
  },

  // Given a model, produce the HTML representation
  // as a string. Takes block models or document.
  // By default, the HTML is for editing (e.g. it
  // has contenteditable attributes set). Pass
  // { for: 'output' } to get HTML without these
  // attributes.
  toHTML: function(model, options) {

    options = typeof options == 'undefined' ? {} : options;
    options['for'] = typeof options['for'] == 'undefined' ? 'editing' : options['for'];

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

      var openingTag = "<" + tag + ( !model.isText() && options['for'] == 'editing' ? ' contenteditable="false"' : '' ) + ( this._layoutType(model.layout()) == 'class' ? ' class="' + model.layout().toLowerCase() + '"' : '' ) + ">";
      var closingTag = "</" + tag + ">";
      var html = openingTag + this._innerHTML(model, options) + closingTag;
      return html;

    } else if (model instanceof MediumEditor.DocumentModel) {

      // Document model.
      var blocks = model.blocks();
      var toReturn = "";
      var currentWrapper = null;
      for(var i = 0; i < blocks.size(); i++) {

        // Grab handles the previous, current and
        // next blocks
        var prevBlock = i > 0 ? blocks.at(i - 1) : null;
        var currentBlock = blocks.at(i);
        var nextBlock = i < (blocks.size() - 1) ? blocks.at(i + 1) : null;

        // If this block has a different wrapper to
        // the last, or is the first block, open
        // the new wrapper
        var layout = currentBlock.layout();
        var wrapper = this._layoutType(layout) == 'wrapper' ? layout : 'SINGLE-COLUMN';
        if (wrapper != currentWrapper) {
          toReturn += "<div class='layout-" + wrapper.toLowerCase() + "'>";
          currentWrapper = wrapper;
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

        // If this block has a different wrapper to
        // the next, close the wrapper
        if (nextBlock == null || (this._layoutType(nextBlock.layout()) == 'wrapper' && currentWrapper != nextBlock.layout())) {
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
  _innerHTML: function(model, options) {

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
        innerHTML += "<figcaption " + (options['for'] == 'editing' ? "contenteditable='true'" : "") + ">" + model.metadata()['caption'] + "</figcaption>";
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
      injects.push({ type: 'open', at: markup.start(), tag: this._tag(markup), obj: markup });
      injects.push({ type: 'close', at: markup.end(), tag: this._tag(markup), obj: markup });
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
          return this._charComparison(a.tag[0], b.tag[0]) * order;
        }
      }
    }.bind(this));

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
        toReturn += this._openingTag(inject.obj);
        openTags.push(inject);

      } else {

        // Tag closing. Grab all the open tags
        // which end after this one.
        var temp = [];
        var c;
        while((c = openTags.pop()) && c.tag != inject.tag) {
          temp.push(c);
        }

        // Close the other tags first
        for (var j = 0; j < temp.length; j++) {
          toReturn += this._closingTag(temp[j].obj);
        }

        // Now close this tag
        toReturn += this._closingTag(inject.obj);

        // Now put the other tags back and re-open
        // them
        while(temp.length) {
          var tag = temp.pop();
          toReturn += this._openingTag(tag.obj);
          openTags.push(tag);
        }
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
  },

  // Layouts are either a wrapper of a class
  _layoutType: function(layout) {
    return layout == 'SINGLE-COLUMN' || layout == 'FULL-WIDTH' ? 'wrapper' : 'class';
  },

  _openingTag: function(model) {
    return "<" + this._tag(model) + " " + this._openingTagAttributes(model) + ">";
  },

  _closingTag: function(model) {
    return "</" + this._tag(model) + ">";
  },

  _tag: function(model) {
    switch(true) {
      case model.isStrong(): return 'strong';
      case model.isEmphasis(): return 'em';
      case model.isAnchor(): return 'a';
    }
  },

  _openingTagAttributes: function(model) {
    switch(true) {
      case model.isAnchor(): return 'href="' + model.href + '"';
    }
    return '';
  },

  // Given an index and offsets in model space,
  // return the equivalent node and offset in DOM
  // space
  modelSpaceToDOMSpace: function(documentEl, ix, offset) {
    var el = this.getBlockElementFromIndex(documentEl, ix);
    var textNodes = this._getTextNodesIn(el);
    for(var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      if (offset <= node.length) {
        return { node: node, offset: offset };
      } else {
        offset -= node.length;
      }
    }
    return { node: el.childNodes[0], offset: Math.min((el.childNodes[0].nodeValue || el.childNodes[0].innerText).length, offset) };
  },

  // Given an index in model space, return the
  // corresponding block DOM element, considering
  // layout and other containers
  getBlockElementFromIndex: function(documentEl, ix) {
    for (var i = 0; i < documentEl.children.length; i++) {
      var layoutContainer = documentEl.childNodes[i];
      for (var j = 0; j < layoutContainer.children.length; j++) {
        var block = layoutContainer.children[j];
        if (block.tagName.toLowerCase() == 'ol' || block.tagName.toLowerCase() == 'ul') {
          if (ix < block.childNodes.length) {
            return block.childNodes[ix];
          } else {
            ix -= block.childNodes.length;
          }
        } else {
          ix--;
        }
        if (ix < 0) return block;
      }
    }
    return null;
  },

  // Source: http://stackoverflow.com/a/6242538/889232
  _getTextNodesIn: function(node) {
    var textNodes = [];
    if (node.nodeType == 3) {
      textNodes.push(node);
    } else {
      var children = node.childNodes;
      for(var i = 0; i < children.length; i++) {
        textNodes.push.apply(textNodes, this._getTextNodesIn(children[i]));
      }
    }
    return textNodes;
  },

  // Given a node and an offset within that node,
  // return an object containing the block index
  // and the text offset in model space.
  domSpaceToModelSpace: function(node, offset, range, start) {
    var element = this._blockElementFromNode(node);
    var ix = this.getIndexFromBlockElement(element);
    var offset = this._measureTextOffset(offset, node, element, range, start);
    return {
      ix:       ix,
      offset:   offset
    }
  },

  // Given a node, returns the block element it
  // belongs to. This assumes the node exists
  // within a block in the editor.
  _blockElementFromNode: function(node) {
    while (node.parentNode.tagName.toLowerCase() != 'div' &&  // Bit hacky - layout containers are the only divs (well dividers use them too, but they can't be selected)
           node.parentNode.tagName.toLowerCase() != 'ol' &&
           node.parentNode.tagName.toLowerCase() != 'ul') {
      node = node.parentNode;
      if (node.parentNode == document.body) return null;
    }
    return node;
  },

  // Given a block element, determine what the
  // index is within model space, considering
  // layout and other containers
  getIndexFromBlockElement: function(el) {

    // Find the document element
    var documentEl = el;
    if (el.tagName.toLowerCase() == 'li') documentEl = documentEl.parentNode;
    documentEl = documentEl.parentNode.parentNode;

    var ix = 0;

    // Iterate every layout container
    for(var i = 0; i < documentEl.children.length; i++) {
      var layoutContainer = documentEl.children[i];

      // Iterate every block within the container
      for(var j = 0; j < layoutContainer.children.length; j++) {
        var block = layoutContainer.children[j];

        // If this is a list parent block, iterate
        // the items underneath
        if (block.tagName.toLowerCase() == 'ul' || block.tagName.toLowerCase() == 'ol') {
          for(var k = 0; k < block.children.length; k++) {
            var li = block.children[k];
            if (li == el) return ix;    // If this is our block, return the index
            ix += 1;
          }
        } else {
          if (block == el) return ix;   // If this is our block, return the index
          ix += 1;
        }
      }
    }
  },

  // Given a layout container, returns the number
  // of block elements contained within. We can't
  // simply count the child nodes, as it may
  // contain a list, and each item counts as a
  // block.
  _numBlockElementsWithin: function(layoutContainer) {
    var count = 0;
    for(var i = 0; i < layoutContainer.childNodes.length; i++) {
      var block = layoutContainer.childNodes[i];
      if (block.tagName.toLowerCase() == 'ol' || block.tagName.toLowerCase() == 'ul') {
        count += block.childNodes.length;
      } else {
        count++;
      }
    }
    return count;
  },

  // The offsets returned by selection objects are
  // relative to their parent node, not the char
  // offset within the element. Convert them.
  // Adapted from http://stackoverflow.com/a/4812022/889232
  _measureTextOffset: function(offset, node, element, range, start) {
    if (window.getSelection) {
      var textRange = range.cloneRange();
      textRange.selectNodeContents(element);
      textRange.setEnd(node, offset);
      return textRange.toString().length;
    } else if (document.selection) {
      var textRange = doc.body.createTextRange();
      textRange.moveToElementText(element);
      textRange.setEndPoint(start ? "StartToEnd" : "EndToEnd", range);
      return textRange.text.length;
    }
  }

};
