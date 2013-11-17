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

var SbvrCollections = {
	facts: [],
	modalops: [
		'It is obligatory that',
		'It is prohibited that',
		'It is necessary that',
		'It is impossible that',
		'It is possible that',
		'It is permitted that'
	],
	terms: []
};

var oop = require('../lib/oop');
var TextHighlightRules = require('./text_highlight_rules').TextHighlightRules;

//Regular expressions for SBVR.
var SbvrRegExs = {
	Term: {
		label: /(^\s*Term\s?:)(\s+?)/,
		term: function (suffix) {
			if (!SbvrCollections.terms.length) {
				return '()' + suffix;
			}
			return '(' + SbvrCollections.terms.map(function(elem){
					return suffix ? elem + suffix : elem;
				}).join('|') + ')';
		}
	},
	FactType: {
		label: /(^\s*Fact [T|t]ype\s?:)(\s+?)/
	},
	Rule: {
		label: /(^\s*Rule\s?:)(\s+?)/,
		modalop: function(){
			return SbvrCollections.modalops.join('|');
		}
	}
};

var SbvrHighlightRules = function() {

	//Update SBVR terms and facts.
	this.updateCollections = function(collections){
		SbvrCollections.terms = collections.terms;
		SbvrCollections.facts = collections.facts;
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
			//Term:
			token: ['sbvr_term_label', 'text'],
			regex: SbvrRegExs.Term.label,
			next: 'term'
		}, {
			//FactType:
			token: ['sbvr_fact_type_label', 'text'],
			regex: SbvrRegExs.FactType.label,
			next: 'fact_type'
		}, {
			//Rule:
			token: ['sbvr_rule_label', 'text'],
			regex: SbvrRegExs.Rule.label,
			next: 'modalop'
		}
	];

	this.$rules.term = [
		{
			token: 'sbvr_term',
			regex: SbvrRegExs.Term.term('(?:$)'),
			next: 'start'
		}
	];

	this.$rules.fact_type = [
		{
			token: ['sbvr_term', 'sbvr_fact_type_verb', 'text', 'sbvr_term'],
			regex: SbvrRegExs.Term.term() + '(.*?)(\\s?)(?:' + SbvrRegExs.Term.term() + '$|(?:$))',
			next: 'start'
		}
	];

	this.$rules.modalop = [
		{
			token: 'sbvr_modalop',
			regex: SbvrRegExs.Rule.modalop(),
			next: 'quantification'
		}
	];

	this.$rules.quantification = [
		{
			token: 'sbvr_quantification',
			regex: /(a)|(of)(\s)(a|each|some|the)|(for\s)?(each)|(some)|(at\s)(least|most)(\s)(\d+?)|(exactly)(\d+?)|(at least \d+? and at most \d+?)|(more than \d+?)/,
			next: 'factType_term'
		}
	]

	this.$rules.factType_term = [
		{
			token: ['text', 'sbvr_term'],
			regex: '(\\s)(\\w+)',
			next: 'start'
		}
	]

};

oop.inherits(SbvrHighlightRules, TextHighlightRules);

exports.SbvrHighlightRules = SbvrHighlightRules;
exports.SbvrRegExs = SbvrRegExs;

});
