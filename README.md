#28 CLI Grunt Task
[![Build Status](http://img.shields.io/travis/28msec/grunt-28/master.svg?style=flat)](https://travis-ci.org/28msec/grunt-28) [![NPM version](http://img.shields.io/npm/v/grunt-28.svg?style=flat)](http://badge.fury.io/js/grunt-28) [![Code Climate](http://img.shields.io/codeclimate/github/28msec/grunt-28.svg?style=flat)](https://codeclimate.com/github/28msec/grunt-28)

Grunt task for [28.io CLI Tool](http://github.com/28msec/28)

## Example
```javascript
        28: {
            options: {
                src: 'queries',
                email: '<%= config.28.email %>',
                password: '<%= config.28.password %>'
            },
            setup: {
                project: '<%= config.s3.bucket %>',
                delete: {
                    idempotent: true
                },
                create: {},
                upload: {
                    projectPath: 'queries'
                },
                datasources: '<%= config.28.datasources %>',
                runQueries: [
                    'queries/private/InitAuditCollection.jq',
                    'queries/private/init.jq',
                    'queries/private/UpdateReportSchema.jq'
                ]
            },
            run: {
                project: '<%= config.s3.bucket %>',
                runQueries: [
                    'queries/public/test/*',
                    'queries/private/test/*'
                ]
            },
            teardown: {
                project: '<%= config.s3.bucket %>',
                delete: {}
            }
        }
```

