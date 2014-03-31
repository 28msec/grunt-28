28 CLI Grunt Task
============

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

