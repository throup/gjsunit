function Testsuite(name) {
	this._init(name);
}
Testsuite.prototype = {
	_init: function(name) {
		this.name = name;
		this.cases = [];
		this.countTestsOverall = 0;
		this.countTestsFailed = 0;
	},

	log: function() {
		let output = '<testsuite name="' + this.name + '" tests="' + this.countTestsOverall + '" failures="' + this.countTestsFailed + '">';
		for( let i in this.cases ) {
			let tc = this.cases[i];
			if( tc.log ) {
				output += tc.log();
			}
		}
		output += '</testsuite>';
		return output;
	}
}

function Testcase(name) {
	this._init(name);
}
Testcase.prototype = {
	_init: function(name) {
		this.name = name;
		this.error = '';
	},

	log: function() {
		let output = '<testcase name="' + this.name + '"';
		if( !this.error ) {
			output += '/>';
		} else {
			output += '><failure message="' + this.error + '"/></testcase>';
		}
		return output;
	},

	fail: function(message) {
		this.error = message;
	}
}
