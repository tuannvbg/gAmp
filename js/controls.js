var controls = (function (){
  var self = {};
  var playlist;
  /**
   * Set HTML player to use.
   *
   * @param {object} audio HTML5 <audio> element.
   */
  self.setAudio = function(audio){
    self.audio = audio;
    self.audio.addEventListener('ended',function(){controls.next()}, false);
  }

  self.setPlaylist = function(pl){
    playlist=pl;
  }

  self.play = function(){
    if (!self.audio.paused){
      self.audio.currentTime = 0;
    }
    self.audio.play();
    $('#favicon')[0].href = 'images/play.png';
  }

  self.pause = function(){
    
    if(self.audio.paused){
      self.play();
    } else {
      self.audio.pause();
      $('#favicon')[0].href = 'images/pause.png';
    }
  }

  self.stop = function(){
    self.pause();
    self.audio.currentTime = 0;
  }

  self.next = function(){
    playlist.next();
    self.audio.src = playlist.getCurrentSong().src;
    self.play();
  }

  self.previous = function(){
    playlist.previous();
    self.audio.src = playlist.getCurrentSong().src;
    self.play();
  }

  var fileToSong = function(file){
    var song={};
    song['name'] = file.name;
    song['src'] = window.URL.createObjectURL(file);
    id3(file, function(err,tags){
        song['tags']=tags;
    });
    return song;
  }

  /**
   * Flattens a nested array.
   *
   * @returns {Array} Array flattened a single level
   */
  Array.prototype.flatten = function (){
    return this.reduce(function(a,b){
      if(a.concat){
        return a.concat(b)
      }else{
        return [a].concat(b)
      }
    });
  }

  /**
   * Sort files by path
   *
   * @param {Array} Array of files.
   * @return {Array} Array of files.
   */
  var sortByPath = function(files){
    return files.sort(function(file1,file2){
        return (file1.webkitRelativePath||file1.mozFullPath||file1.name).
          localeCompare((file2.webkitRelativePath||file2.mozFullPath||file2.name));
    });
  }

  /**
   * Add files to playlist
   *
   * @param {object} el HTML input element
   */
  self.addFiles = function(el){
    el.click();
    el.onchange = function(){
      window.URL = window.URL || window.webkitURL;
      playlist.addSongs(
          sortByPath(
            [].slice.call(el.files)
          ).        
          filter(function(file){
            return ['audio/mpeg','audio/wave','audio/ogg','audio/mp3'].indexOf(file.type)+1;
          }).                
          map(fileToSong)
      );
      el.value = '';
      self.audio.src=playlist.getCurrentSong().src;
    }
  }

  /**
   * Add playlist from file
   *
   * @param {object} el HTML input element.
   */
  self.addPlaylist = function(el){
    el.click();
    el.onchange = function(){
      var file = el.files[0];
      if(!file.type in ['audio/x-mpegurl','audio/x-scpls','audio/mpegurl']){return;}
      fr = new FileReader();
      var entries;
      fr.onloadend =function(){
        if(file.type in ['audio/x-mpegurl','audio/mpegurl']){
          entries = M3U.parse(this.result);
        }else{
          entries = PLS.parse(this.result);
        }
        playlist.addSongs(
          entries.map(function(e){
            if(e){
              var s = {};
              s.src = e.file;
              s.name = e.file.replace(/^.*(\\|\/|\:)/, '');
              s.tags = e;
              return s;
            }
          })
        );
      }
      fr.readAsText(file);
      el.value ='';
      self.audio.src=playlist.getCurrentSong().src;
    }
  }

  self.removeSongs = function(){
    playlist.removeSongs($('#playlist > .ui-selected').
      toArray().
      map(function(div){
      return $(div).index(); })
    );
  }

  /**
   * Define actions when checkbox toggle.
   */
  self.checkToggle = function(el){
    var toggle = el.id;
    playlist[toggle] = el.checked;
  }

  /**
   * Run when document loaded.
   *
   * @param {object} audio HTML5 <audio> element.
   */
  self.setup = function(audio){
    self.setAudio(audio);

    $(document).keyup(function(e){
      if(e.keyCode==32||e.keyCode==19){
        if(self.audio.paused){
          self.play();
        } else {
          self.pause();
        }
      }
      if(e.keyCode==8||e.keyCode==46){
        self.removeSongs();
      }
    });

    $(self.audio).bind('mousewheel',function(e){
      var deltaY = e.originalEvent.deltaY;
      if(deltaY<0){audio.volume+=0.05;}
      if(deltaY>0){audio.volume-=0.05;}
    })
  }
  return self;
}());