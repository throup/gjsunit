// This file is part of the gjsunit framework
// Please visit https://github.com/philipphoffmann/gjsunit for more information

imports.searchPath.push('.');
imports.searchPath.push('/usr/share/gnome-js');
imports.searchPath.push('/usr/share/gnome-shell/js');

const ESC                = "\x1B";
const TP_ANSI_FG_RED     = ESC + "[31m";
const TP_ANSI_FG_GREEN   = ESC + "[32m";
const TP_ANSI_FG_DEFAULT = ESC + "[39m";
const TP_ANSI_FG_GREY    = ESC + "[90m";

var Subject = function(name) {
    "use strict";
    this.name = name;
    this.facets = [];
};
Subject.prototype = {
    addFacet: function(name) {
        "use strict";
        this.currentFacet = new Facet(name);
        this.facets.push(this.currentFacet);
    },

    pass: function(expectation) {
        "use strict";
        this.currentFacet.pass(expectation);
    },

    fail: function(expectation, reason) {
        "use strict";
        this.currentFacet.fail(expectation, reason);
    },

    incrementExpectations: function() {
        "use strict";
        this.currentFacet.incrementExpectations();
    },

    numberTests: function() {
        "use strict";
        return this.facets.length;
    },

    numberExpectations: function() {
        "use strict";
        let count = 0;
        for (let i in this.facets) {
            count += this.facets[i].numberExpectations();
        }
        return count;
    },

    numberFailures: function() {
        "use strict";
        let count = 0;
        for (let i in this.facets) {
            count += this.facets[i].numberFailures();
        }
        return count;
    }
};

var Expectation = function(label) {
    "use strict";
    this.label = label;
    this.state = 0;
    this.failure = '';
}
Expectation.PASS = 1;
Expectation.FAIL = -1;
Expectation.prototype = {
    pass: function() {
        this.state = Expectation.PASS;
    },

    fail: function(reason) {
        "use strict";
        this.state = Expectation.FAIL;
        this.failure = reason;
    }
};

var Facet = function(name) {
    "use strict";
    this.name = name;
    this.expectations = [];
    this.count = 0;
};
Facet.prototype = {
    pass: function(label) {
        "use strict";
        let expectation = new Expectation(label);
        expectation.pass();
        this.expectations.push(expectation);
    },

    fail: function(label, reason) {
        "use strict";
        let expectation = new Expectation(label);
        expectation.fail(reason);
        this.expectations.push(expectation);
    },

    incrementExpectations: function() {
        "use strict";
        ++this.count;
    },

    numberExpectations: function() {
        "use strict";
        return this.count;
    },

    numberFailures: function() {
        "use strict";
        let count = 0;
        for (let i in this.expectations) {
            count += (this.expectations[i].state == Expectation.FAIL);
        }
        return count;
    }
};

var TestRunner = function() {
    "use strict";
    this.countTestsOverall = 0;
    this.countTestsFailed  = 0;
    this.subjects = [];
};
TestRunner.prototype = {
    addSubject: function (moduleName) {
        this.currentSubject = new Subject(moduleName);
        this.subjects.push(this.currentSubject);
    },

    describe: function (moduleName, callback) {
        "use strict";
        this.addSubject(moduleName);
        callback();
    },

    addFacet: function (expectation) {
        this.currentSubject.addFacet(expectation);
    },

    it: function (expectation, callback) {
        this.addFacet(expectation);
        try {
            callback();
            this.testPass(expectation);
        }
        catch (error) {
            this.testFail(expectation, error);
        }
    },

    expect: function(actualValue) {
        function MatcherFactory(actualValue, positive) {
            function triggerResult(success, msg) {
                if( (success && !positive) ||
                    (!success && positive) ) {
                    throw new Error(msg);
                }
            }

            return {
                to: function(callback) {
                    triggerResult(callback(actualValue),
                        '      Expected callback to validate'
                    );
                },
                toBe: function(expectedValue) {
                    triggerResult(actualValue === expectedValue,
                        '      Expected values to match using ===\n' +
                        '      Expected: ' + expectedValue + '\n' +
                        '      Actual: ' + actualValue
                    );
                },
                toEqual: function(expectedValue) {
                    triggerResult(actualValue == expectedValue,
                        '      Expected values to match using ==\n' +
                        '      Expected: ' + expectedValue + '\n' +
                        '      Actual: ' + actualValue
                    );
                },
                toMatch: function(expectedValue) {
                    triggerResult(!!actualValue.match(expectedValue),
                        '      Expected values to match using regular expression\n' +
                        '      Expression: ' + expectedValue + '\n' +
                        '      Actual: ' + actualValue
                    );
                },
                toBeDefined: function() {
                    triggerResult(typeof actualValue !== 'undefined',
                        '      Expected value to be defined'
                    );
                },
                toBeUndefined: function() {
                    triggerResult(typeof actualValue === 'undefined',
                        '      Expected value to be undefined'
                    );
                },
                toBeNull: function() {
                    triggerResult(actualValue === null,
                        '      Expected value to be null'
                    );
                },
                toBeTruthy: function() {
                    triggerResult(actualValue,
                        '      Expected value to be truthy'
                    );
                },
                toBeFalsy: function() {
                    triggerResult(!actualValue,
                        '      Expected value to be falsy'
                    );
                },
                toContain: function(needle) {
                    triggerResult(actualValue instanceof Array && actualValue.indexOf(needle) !== -1,
                        '      Expected ' + actualValue + ' to contain ' + needle
                    );
                },
                toBeLessThan: function(greaterValue) {
                    triggerResult(actualValue < greaterValue,
                        '      Expected ' + actualValue + ' to be less than ' + greaterValue
                    );
                },
                toBeGreaterThan: function(smallerValue) {
                    triggerResult(actualValue > smallerValue,
                        '      Expected ' + actualValue + ' to be greater than ' + smallerValue
                    );
                },
                toBeCloseTo: function(expectedValue, precision) {
                    var shiftHelper = Math.pow(10, precision);
                    triggerResult(Math.round(actualValue * shiftHelper) / shiftHelper === Math.round(expectedValue * shiftHelper) / shiftHelper,
                        '      Expected ' + actualValue + ' with precision ' + precision + ' to be close to ' + expectedValue
                    );
                },
                toThrow: function() {
                    var didThrow = false;
                    try {
                        actualValue();
                        didThrow = false;
                    }
                    catch(e) {
                        didThrow = true;
                    }

                    triggerResult(didThrow,
                        '      Expected ' + actualValue.name + ' to throw an exception'
                    );
                }
            };
        }

        ++this.countTestsOverall;

        var expecter = new MatcherFactory(actualValue, true);
        expecter.not = new MatcherFactory(actualValue, false);

        this.currentSubject.incrementExpectations();
        return expecter;
    },

    testPass: function (expectation) {
        this.currentSubject.pass(expectation);
    },

    testFail: function (expectation, error) {
        this.currentSubject.fail(expectation, error);
        ++this.countTestsFailed;
    }

};

let runner = new TestRunner();

window.describe = function(moduleName, callback) {
	return runner.describe(moduleName, callback);
};

window.it = function(expectation, callback) {
	return runner.it(expectation, callback);
};

window.expect = function(actualValue) {
    return runner.expect(actualValue);
};

var runTests = function(namespace) {
	// recursively check the test directory for executable tests
	for( var subNamespace in namespace ) {

		// execute any test functions
		if( subNamespace === 'testSuite' && typeof namespace[subNamespace] === 'function' ) {
			namespace[subNamespace]();
		}
		// descend into subfolders and objects
		else if( typeof namespace[subNamespace] === 'object' ) {
			runTests(namespace[subNamespace]);
		}
	}
};

// by default we run tests from the 'test' directory
var testDir = 'test';
var knownDirs = [];

// scan all modules we can import
for( var dir in imports ) {
	knownDirs.push(dir);
}

// if the provided argument is amongst the known modules, use that module as the test root
if( ARGV[0] && knownDirs.indexOf(ARGV[0]) !== -1 ) {
	testDir = ARGV[0];
}

// run tests from the test root
runTests(imports[testDir]);

var XmlReporter = function(framework) {
    "use strict";
    this.runner = framework;
};
XmlReporter.prototype = {
    report: function() {
        "use strict";

        let output = '<?xml version="1.0"?>\n';
        output += '<testsuites>';
        for (let i in this.runner.subjects) {
            let subject = runner.subjects[i];
            output += '<testsuite name="' + subject.name + '" tests="' + subject.numberTests() + '" assertions="' + subject.numberExpectations() + '" failures="' + subject.numberFailures() + '">';
            for (let j in subject.facets) {
                let facet = subject.facets[j];
                output += '<testcase name="' + facet.name + '" assertions="' + facet.numberExpectations() + '"';
                if (facet.numberFailures() > 0) {
                    output += '>';
                    for (let k in facet.expectations) {
                        let expectation = facet.expectations[k];
                        if (expectation.state == Expectation.FAIL) {
                            output += '<failure>';
                            output += expectation.failure;
                            output += '</failure>';
                        }
                    }
                    output += '</testcase>';
                } else {
                    output += '/>';
                }
            }
            output += '</testsuite>';
        }
        output += '</testsuites>';

        print(output);
    },

    greyText: function(text) {
        "use strict";
        return TP_ANSI_FG_GREY + text + TP_ANSI_FG_DEFAULT;
    },

    greenText: function(text) {
        "use strict";
        return TP_ANSI_FG_GREEN + text + TP_ANSI_FG_DEFAULT;
    },

    redText: function(text) {
        "use strict";
        return TP_ANSI_FG_RED + text + TP_ANSI_FG_DEFAULT;
    }
};

var reporter = new XmlReporter(runner);
reporter.report();
