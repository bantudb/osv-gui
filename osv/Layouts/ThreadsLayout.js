var OSv = OSv || {};
OSv.Layouts = OSv.Layouts || {};

OSv.Layouts.ThreadsLayout = (function() {
  
  var Boxes = OSv.Boxes;

  function ThreadsLayout() {
    OSv.Layouts.BoxesLayout.apply(this, arguments);
    this.setSelectedThreads();
    this.threadsGraph = new Boxes.ThreadsGraph();
    this.threadsTimeline = new Boxes.ThreadsTimeline();
    this.boxes = [ new Boxes.ThreadsTableBox(), this.threadsGraph, this.threadsTimeline ]

    $(document).on("change", "[data-thread] input", this.onCheckBoxChange.bind(this))

    this.refreshTable();
    this.interval = setInterval(this.refreshTable.bind(this), 2000);
  }


  ThreadsLayout.prototype = new OSv.Layouts.BoxesLayout();
  
  ThreadsLayout.prototype.setSelectedThreads = function () {
    var self = this;
    return OSv.API.OS.threads().then(function (threads) {
      self.threadsGraph.visibleThreads = threads.list.sort(function (thread1, thread2) {
        return thread1.cpu_ms > thread2.cpu_ms ? -1 : 1;
      }).map(function (thread) { 
        return thread.id|0;
      }).slice(0, 9);
    })
  }

  ThreadsLayout.prototype.clear = function() {
    OSv.Layouts.BoxesLayout.prototype.clear.apply(this, arguments);
    clearInterval(this.interval)
  };

  ThreadsLayout.prototype.getSelectedThreads = function() {
    return this.threadsGraph.visibleThreads;
  };

  ThreadsLayout.prototype.showThread = function(threadID) {
    this.threadsGraph.visibleThreads.push(threadID|0);
  };

  ThreadsLayout.prototype.hideThread = function(threadID) {
    this.threadsGraph.visibleThreads = this.threadsGraph.visibleThreads.filter(function (thread) { 
      return thread != threadID
    });
  };

  ThreadsLayout.prototype.refreshTable = function () {
    var visibleThreads = this.threadsGraph.visibleThreads;
    this.boxes[0].refresh(this.getSelectedThreads());
  };

  ThreadsLayout.prototype.refreshGraph = function() {
    this.threadsGraph.renderGraph(false, false)
  };
  
  ThreadsLayout.prototype.onCheckBoxChange = function(event) {
    var $checkbox = $(event.target),
      threadID = $checkbox.attr("data-thread-id")|0;
    
    $checkbox.is(":checked") ? this.showThread(threadID) : this.hideThread(threadID);
    this.refreshGraph();
  };

  return ThreadsLayout;

}());
