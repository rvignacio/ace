define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var SbvrHighlightRules = function() {

	// regexp must not have capturing parentheses. Use (?:) instead.
	// regexps are ordered -> the first match is used
	this.$rules = {
		"start" : [
			{
				token : "comment",
				regex : "#.*$"
			}, {
				token : "list.markup",
				regex : /^(?:-{3}|\.{3})\s*(?=#|$)/
			},  {
				token : "list.markup",
				regex : /^\s*[\-?](?:$|\s)/
			}, {
				token: "constant",
				regex: "!![\\w//]+"
			}, {
				token: "constant.language",
				regex: "[&\\*][a-zA-Z0-9-_]+"
			}, {
				token: ["meta.tag", "keyword"],
				regex: /^(\s*\w.*?)(\:(?:\s+|$))/
			},{
				token: ["meta.tag", "keyword"],
				regex: /(\w+?)(\s*\:(?:\s+|$))/
			}, {
				token : "keyword.operator",
				regex : "<<\\w*:\\w*"
			}, {
				token : "keyword.operator",
				regex : "-\\s*(?=[{])"
			}, {
				token : "string", // single line
				regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
			}, {
				token : "string", // multi line string start
				regex : '[|>][-+\\d\\s]*$',
				next : "qqstring"
			}, {
				token : "string", // single quoted string
				regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
			}, {
				token : "constant.numeric", // float
				regex : /[+\-]?[\d_]+(?:(?:\.[\d_]*)?(?:[eE][+\-]?[\d_]+)?)?\b/
			}, {
				token : "constant.numeric", // other number
				regex : /[+\-]?\.inf\b|NaN\b|0x[\dA-Fa-f_]+|0b[10_]+/
			}, {
				token : "constant.language.boolean",
				regex : "(?:true|false|TRUE|FALSE|True|False|yes|no)\\b"
			}, {
				token : "invalid.illegal", // comments are not allowed
				regex : "\\/\\/.*$"
			}, {
				token : "paren.lparen",
				regex : "[[({]"
			}, {
				token : "paren.rparen",
				regex : "[\\])}]"
			}
		],
		"qqstring" : [
			{
				token : "string",
				regex : '(?=(?:(?:\\\\.)|(?:[^:]))*?:)',
				next : "start"
			}, {
				token : "string",
				regex : '.+'
			}
		]};

};

oop.inherits(SbvrHighlightRules, TextHighlightRules);

exports.SbvrHighlightRules = SbvrHighlightRules;
});
