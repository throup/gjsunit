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

    it: function (expectation, callback) {
        this.currentSubject.addFacet(expectation);
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

var ConsoleReporter = function(framework) {
    "use strict";
    this.runner = framework;
};
ConsoleReporter.prototype = {
    report: function() {
        "use strict";

        for (let i in this.runner.subjects) {
            let subject = runner.subjects[i];
            print('\n' + subject.name);
            for (let j in subject.facets) {
                let facet = subject.facets[j];
                for (let k in facet.expectations) {
                    let expectation = facet.expectations[k];
                    if (expectation.state == Expectation.PASS) {
                        print(this.greenText(' ✔ ') + this.greyText(expectation.label));
                    } else if (expectation.state == Expectation.FAIL) {
                        print(this.redText(' ❌ ') + this.greyText(expectation.label));
                        print(this.redText(expectation.failure));
                    }
                }
            }
        }

        if( this.runner.countTestsFailed ) {
            // some tests failed
            print('\n' + this.redText('❌ ' + this.runner.countTestsFailed + ' of ' + this.runner.countTestsOverall + ' tests failed'));
        }
        else {
            // all tests okay
            print('\n' + this.greenText('✔ ' + this.runner.countTestsOverall + ' completed'));
        }

        print();
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

var reporter = new ConsoleReporter(runner);
reporter.report();
