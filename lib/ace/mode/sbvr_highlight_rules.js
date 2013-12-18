/**
 * sbvr_highlight_rules.js
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

//Collections container.
var SbvrCollections = {
	conditions: [],
	facts: [],
	modalities: [],
	quantifications: [],
	relations: [],
	specialFacts: [],
	terms: [],
	verbs: [],

	sortByLength: function (a,b) {
		return b.length - a.length;
	}
};

//Regular expressions derived from SbvrCollections.
var SbvrRegExs = {
	conditions: '()',
	facts: '()',
	modalities: '()',
	quantifications: '()',
	relations: '()',
	terms: '()',
	verbs: '()'
};

var oop = require('../lib/oop');
var TextHighlightRules = require('./text_highlight_rules').TextHighlightRules;

var SbvrHighlightRules = function() {

	//Update all SBVR collections.
	this.updateCollections = function(collections){

		//For each collection in collections (terms, fact_types, verbs, modalities, etc...)
		Object.keys(collections).forEach(function (collectionName) {

			//Do nothing if SbvrCollections doesn't contain the same collection.
			if (!SbvrCollections[collectionName]) {
				return;
			}

			//Reset the collection.
			SbvrCollections[collectionName] = [];
			//And populate it again.
			Object.keys(collections[collectionName]).forEach(function (key) {

				//Value to push to the array.
				var value = collections[collectionName][key];

				switch (collectionName){
				case "quantifications":
					//Change "at least NRO and at most NRO" to "at least \\d+ and at most \\d+".
					SbvrCollections[collectionName].push(value.replace(/NRO/g,"\\\\d+"))
					break;
				default:
					SbvrCollections[collectionName].push(value);
					break;
				}

				return

			});

			//Hack: order collection members by decreasing length so that the regex matches
			//correctly both "a" and "a b".
			SbvrCollections[collectionName].sort(SbvrCollections.sortByLength);

			//Create the regular expression for the current collection.
			SbvrRegExs[collectionName] = '(' + SbvrCollections[collectionName].join('|') + ')';

			return;

		});

		//The verbs RegEx must contain all the parsed verbs plus the special verbs (is state of, is property of).
		var allVerbs = SbvrCollections.specialFacts.concat(SbvrCollections.verbs).sort(SbvrCollections.sortByLength);
		SbvrRegExs.verbs = '(' + allVerbs.join('|') + ')';

		console.log("Server collections:")
		console.log(collections)
		console.log("Updated collections:")
		console.log(SbvrCollections)

		return;

	};

	// regexp must not have capturing parentheses. Use (?:) instead.
	// regexps are ordered -> the first match is used
	this.$rules = {};

	//Start recognizing the labels
	this.$rules.start = [
		{
			token : 'comment',
			regex : '#.*$'
		}, {
			//Label Term:
			token: ['sbvr_term_label', 'text'],
			regex: /(^\s*Term\s?:)(\s+?)/,
			next: 'term'
		}, {
			//Label FactType:
			token: ['sbvr_fact_type_label', 'text'],
			regex: /(^\s*Fact\s?[T|t]ype\s?:)(\s+?)/,
			next: 'fact_type'
		}, {
			//Label Rule:
			token: ['sbvr_rule_label', 'text'],
			regex: /(^\s*Rule\s?:)(\s+?)/,
			next: 'rule'
		}
	];

	this.$rules.term = [
		{
			token: ['sbvr_term'],
			regex: SbvrRegExs.terms + '(?:$)',
			next: 'start'
		}
	];

	this.$rules.fact_type = [
		{
			//          the        receiver             attaches                           medicine
			token: ['sbvr_other', 'sbvr_term', 'text', 'sbvr_verb', 'text', 'sbvr_verb', 'sbvr_term',
			//             with      medicine delivery report
				'text', 'sbvr_verb', 'sbvr_term'],
			regex: '(.*?)' + SbvrRegExs.terms + '(\\s.*?)' + SbvrRegExs.verbs + '(\\s)(.*?)' + SbvrRegExs.terms +
				'(\\s)(.*?)' + SbvrRegExs.terms +'(?:$)',
			next: 'start'
		}, {
			//                      pending            is state of                         recipe        //special facts
			//          the          person                 has                             role         //facts
			//                       nurse                  is                kind of       role         //phrases
			token: ['sbvr_other', 'sbvr_term', 'text', 'sbvr_verb', 'text', 'sbvr_verb', 'sbvr_term'],
			regex: '(.*?)' + SbvrRegExs.terms + '(\\s.*?)' + SbvrRegExs.verbs + '(\\s)(.*?)' + SbvrRegExs.terms + '(?:$)',
			next: 'start'
		}
	];

	this.$rules.rule = [
		{
			token: [
				'sbvr_modalop', 'text',
				'sbvr_quantification', 'text',
				'sbvr_term', 'text',
				'sbvr_verb', 'text',
				'sbvr_other', 'text',
				'sbvr_term', 'text',
				'sbvr_verb', 'sbvr_verb',
				'sbvr_term'
			],
			regex:
				SbvrRegExs.modalities + '(\\s)' +
				SbvrRegExs.quantifications + '(\\s)' +
				SbvrRegExs.terms + '(\\s)' +
				SbvrRegExs.verbs + '(\\s)' +
				'(.*?)' + '(\\s)' +
				SbvrRegExs.terms + '(\\s.*?)' +
				SbvrRegExs.verbs + '(\\s.*?)' +
				SbvrRegExs.terms + '(?:$)',
			next: 'start'
		}
	];

};

oop.inherits(SbvrHighlightRules, TextHighlightRules);

exports.SbvrHighlightRules = SbvrHighlightRules;
exports.SbvrRegExs = SbvrRegExs;

});
