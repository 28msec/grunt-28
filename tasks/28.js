'use strict';

module.exports = function (grunt) {
    grunt.registerMultiTask('28', 'Upload queries to a 28.io project', function(){
        var fs = require('fs');
        var ffs = require('final-fs');
        var Q = require('q');
        var API = require('28/lib/28.js');
        var Client = require('28/lib/client.js');
        var opts = this.options();
        var url =  opts.api.protocol + '://' + opts.api.name + '.' + opts.api.domain + opts.api.prefix;
        var path = opts.path;

        var done = this.async();

        var projectName = this.data.project;
        
        function objectConcat(o1, o2) {
            for (var key in o2) {
                o1[key] = o2[key];
            }
            return o1;
        }
        
        var getRemoteFiles = function(lists){
            return objectConcat(objectConcat(lists[0][0], lists[0][1]), lists[0][2]);
        };

        var getLocalFiles = function(lists) {
            var local = [];
            lists[1].forEach(function(f){
                local[f] = {
                    //TODO: remove String conversion
                    lastModified: new Date(fs.statSync(path + '/' + f).mtime).toISOString()
                };
            });
            lists[2].forEach(function(f){
                local[f] = {
                    lastModified: new Date(fs.statSync(path + '/' + f).mtime).toISOString()
                };
            });
            lists[3].forEach(function(f){
                local[f] = {
                    lastModified: new Date(fs.statSync(path + '/' + f).mtime).toISOString()
                };
            });
            return local;
        };

        API.Auth(url)
        .auth({ email: opts.email, password: opts.password, grant_type: 'client_credentials' })
        .then(function(session){
            var projectToken = session.project_tokens['project_'+projectName];
            if(projectToken) {
                ffs.mkdirRecursiveSync(path + '/modules', 511);
                ffs.mkdirRecursiveSync(path + '/public', 511);
                ffs.mkdirRecursiveSync(path + '/private', 511);
                var project_url =  opts.api.protocol + '://' + projectName + '.' + opts.api.domain + '/' + opts.api.version;
                var project = API.Project(project_url, projectToken);
                Q.all([
                    project.listFiles(),
                    ffs.readdirRecursive(path + '/modules', true, 'modules'),
                    ffs.readdirRecursive(path + '/public', true, 'public'),
                    ffs.readdirRecursive(path + '/private', true, 'private')
                ])
                .then(function(lists){
                    var remote = getRemoteFiles(lists);
                    var local = getLocalFiles(lists);
                    Client.upload(
                        project, remote, local,
                        Client.OVERWRITE_ASK,
                        true,
                        false
                    )
                    .then(function(){
                        grunt.log.write('Done.');
                        done();
                    })
                    .catch(function(error){
                        grunt.fail.fatal(error);
                        done(false);
                    });
                })
                .catch(function(error){
                    grunt.fail.fatal(error);
                    done(false);
                });
            } else {
                grunt.fail.fatal('Project ' + projectName + ' wasn\'t found.'.red);
                done(false);
            }
        },
        function(error){
            grunt.fail.fatal('Authentication failed. Server replied:'.red);
            grunt.fail.fatal(error.red);
            done(false);
        });
    });
};
