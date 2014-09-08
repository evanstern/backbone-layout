/* jshint camelcase:false */
module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json")
        , watch: {
          scripts: {
            files: [
              "js/**/*.js",
              "tests/**/*.js"
            ],
            tasks: ["jshint", "jasmine"]
          }
        }
        , jshint: {
            options: {
                "laxcomma": true
            }
            , ignore_warning: {
                options: {
                    "-W030": true
                }
                , files: {
                    src: ["js/*js"]
                }
            }
        }
        , copy: {
            build: {
                files: [
                    {src: "<%= pkg.name %>.js", dest: ".", cwd: "js/", expand: true}
                ]
            }
        }
        , uglify: {
            options: {
                sourceMap: "<%= pkg.name %>.map.js"
            }
            , build: {
                src: "js/<%= pkg.name %>.js"
                , dest: "<%= pkg.name %>.min.js"
            }
        }
        , jasmine: {
            browser: {
                src: ["js/<%= pkg.name %>.js"]
                , options: {
                    specs: "tests/*js"
                    , vendor: [
                        "bower_components/jquery/jquery.js"
                        , "bower_components/underscore/underscore.js"
                        , "bower_components/backbone/backbone.js"
                    ]
                }
            }
            , amd: {
                src: ["js/<%= pkg.name %>.js"]
                , options: {
                    specs: "tests/*js"
                    , template: require("grunt-template-jasmine-requirejs")
                    , templateOptions: {
                        requireConfig: {
                            baseUrl: "js/"
                            , paths: {
                                "backbone": "../bower_components/backbone/backbone"
                                , "underscore": "../bower_components/underscore/underscore"
                                , "jquery": "../bower_components/jquery/jquery"
                            }
                            , shim: {
                                backbone: {
                                  deps: ["underscore", "jquery"]
                                  , exports: "Backbone"
                                },
                                underscore: {
                                  exports: '_'
                                }
                            }
                        }
                    }
                }
            }
        }
        , docco: {
            build: {
                src: ["js/<%= pkg.name %>.js"]
                , options: {
                    output: "docs/"
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-docco");
    grunt.registerTask("default", ["jshint", "copy", "uglify", "docco"]);

    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.registerTask("test", ["jasmine"]);
};

