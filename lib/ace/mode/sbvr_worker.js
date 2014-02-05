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
var SbvrRegExs = require('./sbvr_highlight_rules').SbvrHighlightRules.SbvrRegExs;

var SbvrWorker = function(sender) {
	Mirror.call(this, sender);

	//setTimeout is defined in Mirror.
	this.setTimeout(1000);

	return;
};

oop.inherits(SbvrWorker, Mirror);

//Parse all the text from the file.
var parse = function (file, callback) {

	var errors = [];

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
		if (xmlhttp.readyState === 4){
			if (xmlhttp.status !== 200) {
				callback('Error consultando el parser!');
				return;
			}
			var results = JSON.parse(xmlhttp.responseText);
			callback(null, results.collections);
		}
		return;
	}
	xmlhttp.open('POST', '/horilka/parser', true)
	xmlhttp.send(file);

	return;

};

(function() {

	this.onUpdate = function(){
		var self = this;

		parse(this.doc.getValue(), function (err, collections) {
			if (err !== null) {
				//TODO: emit error.
			}
			self.sender.emit('sbvr.parsed', {
				SbvrCollections: collections
			});

			return;
		});

		return;

	};

}).call(SbvrWorker.prototype);

exports.SbvrWorker = SbvrWorker;

});
