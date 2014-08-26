var OSv = OSv || {};
OSv.API = OSv.API || {};

OSv.API.ThreadsGraphAPI = (function() {

  function ThreadsGraphAPI() {
    this.path = "/os/threads";
    this.data = [];
    this.startPulling();
  };
  
  ThreadsGraphAPI.prototype = Object.create(OSv.API.GraphAPI.prototype);

  ThreadsGraphAPI.prototype.prevTime = {};

  ThreadsGraphAPI.prototype.timems = 0;

  ThreadsGraphAPI.prototype.idles = {};

  ThreadsGraphAPI.prototype.threads = {};

  ThreadsGraphAPI.prototype.names = {};
  
  ThreadsGraphAPI.prototype.statuses = {};

  ThreadsGraphAPI.prototype.formatResponse = function (threads) { 

    var timestamp = Date.now(),
      self = this,
      parsedThreads,
      newTimems = threads.time_ms,
      diff = {},
      idles = {};

    threads.list.forEach(function (thread) {
      
      self.names[ thread.id ] = thread.name; 
      self.statuses[ thread.id ] = thread.status;
      if (self.timems) {
        diff[ thread.id ] = thread.cpu_ms - self.prevTime[ thread.id ];
      }
      
      self.prevTime[ thread.id ] = thread.cpu_ms;  

      if ( thread.name.indexOf("idle") != -1 && self.timems) {
        idles[ thread.id ] = {
          diff: diff[ thread.id ],
          id: thread.id,
          name: thread.name,
          cpu_ms: thread.cpu_ms
        };
      }

    });

    $.map(idles, function (idle) {
      
      self.idles[ idle.id ] = self.idles[ idle.id ] || idle;

      var percent =(100 - (100 * idle.diff) / (newTimems - self.timems));

      self.idles[ idle.id ].cpu_ms = idle.cpu_ms; 
      
      self.idles[ idle.id ].plot = self.idles[ idle.id ].plot || [];

      self.idles[ idle.id ].plot.push([ timestamp,  percent]);

    })

    $.map(diff, function (val, key) {
      return [[key, val]]
    }).sort(function (t1, t2) {
      return t1[1] > t2[1] ? -1 : 1;
    }).forEach(function (diff) {
      var id = diff[0]|0;
      
      var percent = (100 * diff[1]) / (newTimems - self.timems);
      if (!self.threads[ id ]) {
        self.threads[ id ] = {id : id, name: self.names[ id ], plot: [], statusTimeline: [] }
      }

      self.threads[ id ].statusTimeline.push({
        time: timestamp,
        status: self.statuses[ id ]
      });

      self.threads[ id ].plot.push([
        timestamp,
        percent
      ]);

    });

    self.timems = newTimems;

  };

  ThreadsGraphAPI.prototype.getThreads = function() {
    return this.threads;
  };

  ThreadsGraphAPI.prototype.averageCpus = function(cpus) {
    cpus = $.map(cpus, function (cpu) { return cpu; })
    var plotLength = cpus[0].plot.length,
        cpusCount = cpus.length,
        averagePlot = [],
        point = [],
        pointsSum,
        pointAvarge,
        timestamp;

    for (var plotIdx = 0; plotIdx < plotLength - 1; plotIdx++) {
      timestamp = cpus[0].plot[plotIdx][0];
      sum = 0;
      for (var cpuIdx = 0; cpuIdx < cpusCount - 1; cpuIdx++) {
        sum += cpus[cpuIdx].plot[plotIdx][1]
      }
      pointAvarge = sum / cpusCount;
      averagePlot.push([ timestamp, pointAvarge ]);
    }

    return averagePlot;
  };

  ThreadsGraphAPI.prototype.hasCPUData = function() {
    return Object.keys(this.data).length > 1;
  }
  ThreadsGraphAPI.prototype.getCpuAvergae = function() {
    return this.hasCPUData() ? this.averageCpus(this.idles) : [];
  };

  ThreadsGraphAPI.prototype.getData = function () {
    return $.Deferred().resolve(this.getThreads());
  };

  ThreadsGraphAPI.prototype.getCpu = function () {
    return this.idles;
  };

  return ThreadsGraphAPI;

}());
