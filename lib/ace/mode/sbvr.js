/**
 * sbvr.js
 *
 * Copyright (C) 2013 by rvignacio.
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 *
 */
define(function(require, exports, module) {
'use strict';

var oop = require('../lib/oop');
var EventEmitter = require('../lib/event_emitter').EventEmitter;

var TextMode = require('./text').Mode;
var Tokenizer = require('../tokenizer').Tokenizer;
var SbvrHighlightRules = require('./sbvr_highlight_rules').SbvrHighlightRules;
var MatchingBraceOutdent = require('./matching_brace_outdent').MatchingBraceOutdent;
var FoldMode = require('./folding/coffee').FoldMode;
var WorkerClient = require("../worker/worker_client").WorkerClient;

var Mode = function() {
	this.HighlightRules = SbvrHighlightRules;
	this.$outdent = new MatchingBraceOutdent();
	this.foldingRules = new FoldMode();
};
oop.inherits(Mode, TextMode);

(function() {

	this.$id = 'ace/mode/sbvr';

	this.lineCommentStart = '#';

	this.getNextLineIndent = function(state, line, tab) {
		return 0;
	};

	this.checkOutdent = function(state, line, input) {
		return this.$outdent.checkOutdent(line, input);
	};

	this.autoOutdent = function(state, doc, row) {
		this.$outdent.autoOutdent(doc, row);
	};

	this.collections = {};

	this.setAnnotations = function (session, errors) {
		var errorList = [];
		Object.keys(errors).forEach(function (key) {
			errorList.push({
				row: parseInt(key, 10) - 1, //0 based
				column: 0,
				text: errors[key],
				type: 'error',
				raw: errors[key]
			});
		});
		session.setAnnotations(errorList);
	};

	//Worker for interacting with parser.
	this.createWorker = function(session) {
		var self = this;

		var worker = new WorkerClient(["ace"], "ace/mode/sbvr_worker", "SbvrWorker");
		worker.attachToDocument(session.getDocument());

		worker.on('sbvr.parsed', function (event) {

			var collections = event.data.SbvrCollections;

			//If errors, format and show them as annotations.
			self.setAnnotations(session, collections.errors);

			self.$highlightRules.updateCollections(collections);

			//Updates the tokenizer to reload.
			session.bgTokenizer.tokenizer = self.getTokenizer();
			session.bgTokenizer.stop();
			session.bgTokenizer.start(0);

			return;
		});



		return worker;
	};

	this.getTokenizer = function() {
		//Create rules only once
		this.$highlightRules = new this.HighlightRules();
		this.$tokenizer = new Tokenizer(this.$highlightRules.getRules());
		return this.$tokenizer;
	};

}).call(Mode.prototype);

exports.Mode = Mode;

});
