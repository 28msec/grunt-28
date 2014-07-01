#28 CLI Grunt Task
[![Build Status](http://img.shields.io/travis/28msec/grunt-28/master.svg?style=flat)](https://travis-ci.org/28msec/grunt-28) [![NPM version](http://img.shields.io/npm/v/grunt-28.svg?style=flat)](http://badge.fury.io/js/grunt-28) [![Code Climate](http://img.shields.io/codeclimate/github/28msec/grunt-28.svg?style=flat)](https://codeclimate.com/github/28msec/grunt-28)

Grunt task for [28.io CLI Tool](http://github.com/28msec/28)

## Example
```javascript
grunt.initConfig({
    '28': {
        options: {
            src: '/path/to/queries',
            email: 'w@28.io',
            password: '****',
            project: 'test'
        },
        dist: {}
    }
});
```

