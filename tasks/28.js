'use strict';

module.exports = function (grunt) {
    grunt.registerMultiTask('28', 'Upload queries to a 28.io project', function(){
        var fs = require('fs');
        var ffs = require('final-fs');
        var Q = require('q');
        var API = require('./28.js');
        var Client = require('./client.js');
        var opts = this.options();
        var path = opts.path;
        
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
            lists[1].forEach(function(path){
                local[path] = {
                    //TODO: remove String conversion
                    lastModified: new Date(fs.statSync(path).mtime).toISOString()
                };
            });
            lists[2].forEach(function(path){
                local[path] = {
                    lastModified: new Date(fs.statSync(path).mtime).toISOString()
                };
            });
            lists[3].forEach(function(path){
                local[path] = {
                    lastModified: new Date(fs.statSync(path).mtime).toISOString()
                };
            });
            return local;
        };
        
        API.Auth(opts.API_URL)
        .auth({ email: opts.email, password: opts.password, grant_type: 'client_credentials' })
        .then(function(session){
            var projectToken = session.project_tokens['project_'+opts.projectName];
            if(projectToken) {
                ffs.mkdirRecursiveSync(path + 'modules', 511);
                ffs.mkdirRecursiveSync(path + 'public', 511);
                ffs.mkdirRecursiveSync(path + 'private', 511);
                var project = API.Project(opts.PROJECT_URL, projectToken);
                Q.all([
                    project.listFiles(),
                    ffs.readdirRecursive(path + 'modules', true, 'modules'),
                    ffs.readdirRecursive(path + 'public', true, 'public'),
                    ffs.readdirRecursive(path + 'private', true, 'private')
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
                    .then(function(){console.log('Done.');})
                    .catch(function(error){
                        console.error(error);
                    });
                })
                .catch(function(error){
                    console.error('Server replied with:'.red);
                    console.error(error.red);
                });
            } else {
                console.error('Project ' + projectToken + ' wasn\'t found.'.red);
                console.error('Run \'28 projects\' for more information.'.red);
            }
        })
        .catch(function(error){
            console.error('Authentication failed. Server replied:'.red);
            console.error(error.red);
        });
        
    });
};
