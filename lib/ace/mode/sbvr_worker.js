/**
 * sbvr_worker.js
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
var Mirror = require('../worker/mirror').Mirror;
var SbvrRegExs = require('./sbvr_highlight_rules').SbvrRegExs;

var SbvrWorker = function(sender) {
	Mirror.call(this, sender);

	//setTimeout is defined in Mirror.
	this.setTimeout(1000);

	return;
};

oop.inherits(SbvrWorker, Mirror);

//Init the collections of language components.
var SbvrCollections = {
	terms: [],
	facts: []
};

//Parse one line of text.
var parseLine = function (line, callback) {

	var matches = null;

	matches = line.raw.match(SbvrRegExs.Term)
	if (matches) {
		//matches is an array, it's fourth group is the term to evaluate.
		var term = matches[3];
		//The element is new, call parser...
		//For now, let's assume the term is valid
		SbvrCollections.terms.push(term);
		var error = null;
		/** Error sample
		error = {
			row: line.number, //0 based
			column: 0,
			text: 'Sample error in line '+(line.number+1)+'!',
			type: 'error',
			raw: 'This is the raw error...'
		}
		*/
		callback(null, error);
		return;
	};

	//Return err, lineErrors.
	callback(null, null);

	return;

};

//Parse all the text from the file.
var parse = function (file, callback) {

	var errors = [];

	//Make an array from the text where each element is a line.
	var lines = file.split('\n');

	//Parse each line and make an array with errors if any.
	(function iterateLines(index) {

		if (index >= lines.length) {
			//All lines were parsed, execute callback and exit.
			callback(null, errors);
			return;
		}

		var line = {
			number: index, //Line number is based 0 (includes annotations).
			raw: lines[index]
		}

		parseLine(line, function (err, lineErrors) {
			if (err !== null) {
				callback(err);
				return;
			}

			if (lineErrors) {
				errors.push(lineErrors);
			}
			iterateLines(++index);

			return;
		});

	})(0);

	return;

};

(function() {

	this.onUpdate = function(){
		var self = this;

		//Reset collections.
		SbvrCollections.terms = [];
		SbvrCollections.facts = [];

		parse(this.doc.getValue(), function (err, errors) {
			if (err !== null) {
				//TODO: emit error.
			}
			self.sender.emit('sbvr.parsed', {
				sbvrCollections: SbvrCollections,
				errors: errors
			});
			return;
		});

		return;

	};

}).call(SbvrWorker.prototype);

exports.SbvrWorker = SbvrWorker;

});
