/*global module:false*/

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      src: [
        'Gruntfile.js',
        'lib/**/*.js',
        'bin/fakeminder',
        'test/**/*.js',
        'sample_target/app.js',
        'sample_target/routes/*.js'
      ],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        globals: {
          require: true,
          define: true,
          requirejs: true,
          describe: true,
          expect: true,
          it: true,
          beforeEach: true
        }
      }
    },
    simplemocha: {
      all: {
        src: ['test/**/*.js'],
        options: {
          globals: ['expect'],
          timeout: 2000,
          ignoreLeaks: false,
          reporter: 'dot'
        }
      }
    },
    watch: {
      files: ['<%= jshint.src %>'],
      tasks: ['jshint', 'simplemocha']
    },
    casperjs: {
      options: {},
      files: {src: ['sample_target/test/**/*.js']}
    },
    express: {
      options: {
        output: "Express server listening on port .+"
      },
      sample_target: {
        options: {
          script: 'sample_target/app.js'
        }
      }
    },
    gitpush: {
      github: {
        options: {
          remote: 'github',
          branch: 'master'
        }
      }
    },
    coverage: {
      options: {
        thresholds: {
          statements: 90,
          branches: 90,
          lines: 90,
          functions: 90
        },
        dir: 'coverage'
      }
    },
    clean: ['coverage'],
    open: {
      cover: {
        path: 'coverage/lcov-report/index.html',
        app: 'Google Chrome'
      }
    }
  });

  // Load JSHint task
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-casperjs');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-clear');
  grunt.loadNpmTasks('grunt-git');
  grunt.loadNpmTasks('grunt-istanbul-coverage');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-open');

  // Default task.
  grunt.registerTask('default', ['clear', 'jshint', 'simplemocha']);
  grunt.registerTask('test', ['clear', 'simplemocha']);
  grunt.registerTask('int-test', 'Execute integration tests against the sample app through the proxy', function() {
    // Make sure failed automation tests don't break the entire task
    // so we can shutdown both the FakeMinder and Express apps.
    grunt.option('force', true);
    grunt.task.run('clear');
    grunt.task.run('fakeminder-start');
    grunt.task.run('express:sample_target');
    grunt.task.run('casperjs');
    grunt.task.run('express:sample_target:stop');
    grunt.task.run('fakeminder-stop');
  });
  grunt.registerTask('cover', ['clear', 'clean', 'istanbul', 'open:cover']);
  grunt.registerTask('cover-check', ['clear', 'clean', 'istanbul', 'coverage']);

  var server;

  // Run the FakeMinder server
  grunt.registerTask('fakeminder-start', 'Start an instance of FakeMinder using the default config.', function() {
    var done = this.async();

    server = grunt.util.spawn({
      cmd: './bin/fakeminder',
      args: ['start', 'config.json']
    }, done);

    server.stdout.on('data', function(data) {      
      var message = '' + data;
      var regex = new RegExp('FakeMinder listening on port ');
      if (message.match(regex)) {
        done();
      }
    });

    server.stdout.pipe(process.stdout);
    server.stderr.pipe(process.stderr);
  });

  // End the FakeMinder server
  grunt.registerTask('fakeminder-stop', 'Stop the running instance of FakeMinder.', function() {
    if (server && server.kill) {
      server.kill('SIGTERM');
      server = null;
    }
  });

  // Commit changes to Github.
  grunt.registerTask('commit', 'Commit changes to Github', function(env) {
    grunt.task.run('clear');
    grunt.task.run('default');
    grunt.task.run('int-test');
    grunt.task.run('gitpush:github');

    grunt.log.ok('Changes successfully committed to Github.');
  });

  // Run mocha tests while also generating code coverage using istanbul
  grunt.registerTask('istanbul', 'Generate coverage using istanbul from mocha tests', function() {
    var done = this.async();

    server = grunt.util.spawn({
      cmd: './node_modules/.bin/istanbul',
      args: ['cover', '_mocha', '--']
    }, done);

    server.stdout.pipe(process.stdout);
    server.stderr.pipe(process.stderr);
  });
};
