## HEKO-3.2.3
#### ADDED
- song preview in add songs to playlist modal
#### FIXED
- add songs to playlist modal container overflow y

## HEKO-3.2.2
#### ADDED
- add songs to playlist modal

## HEKO-3.2.1
#### ADDED
- account removal with mail confirmation
- settings
- themes
#### FIXED
- refresh playlist container on logout
- contextmenu overflow

## HEKO-3.2.0
#### ADDED
- add songs from youtube

## HEKO-3.1.0
#### ADDED
- playlist merge
#### FIXED
- move in root duplication

## HEKO-3.0.6
#### ADDED
- global shortcuts (play, previous, next, volume up and down)
#### FIXED
- input select text overflow

## HEKO-3.0.5
#### ADDED
- move playlist position
- auto focus error input when error in modal
- maintenance message
#### FIXED
- not closing playlist when removing current opened playlist parent
- playlist name validity check when renaming playlist

## HEKO-3.0.4
#### ADDED
- song control shortcuts
- no inputs modals enter shortcut
- contextmenu shortcuts
#### FIXED
- pause the song when adjusting the audio current time with the slider
- remove playlist with thumbnail duplicated crash
- 1 song playlist long not working

## HEKO-3.0.3
#### ADDED
- update / remove playlist thumbnail
- song filter input reset & blur shortcut
#### FIXED
- playlist thumbnail not centered
- adding song in parent playlist
- account button not accessible when user has no playlists
- artist list not updating when updating song artist 
- doubles in artist list when adding or editing a song

## HEKO-3.0.2
#### ADDED
- window thumbar song control buttons
- set playlist thumbnail
#### FIXED
- open current opened playlist
- contextmenu text overflow x
- next song button not working in playlist with only on song

## HEKO-3.0.1
#### ADDED
- song filter
#### FIXED
- modal file input cursor bug
- contextmenu out of window

## HEKO-3.0.0
#### REMAKE CODE FROM SCRATCH
#### ADDED
- accounts
#### MODIFIED
- everything is stored online





## HEKO-2.1.4
#### STYLE
- added borders

## HEKO-2.1.3
#### FIXED
- disabled console

## HEKO-2.1.2
#### FIXED
- shortcut disabled when writing in song filter input
- anti spam when confirming an action inside a modal
- song file input not resetting when closing add song to app modal 

## HEKO-2.1.1
#### FIXED
- loop not looping current song

## HEKO-2.1.0
#### ADDED
- data backup when closing app
- gloabal play / pause shortcut
- gloabal next shortcut
- gloabal previous shortcut
- play button for music in remove songs from app modal
- play button for music in add songs to playlist modal
- window title's link redirect to current version changelog (instead of last version)
#### FIXED
- version checking

## HEKO-2.0.7
#### ADDED
- delay when refreshing
- number of each song saved
#### FIXED
- songs can't be added to playlist parent through contextmenu
- random can't have same song twice in a row
- renaming playlist filters
- window title text
- window title link

## HEKO-2.0.6
#### ADDED
- volume up / down shortcuts
- add to queue
- mute / unmute volume shortcut
- visual for current song in current listening playlist
- info modals
#### FIXED
- shortcut not working if maj

## HEKO-2.0.5
#### ADDED
- volume slider
- current song as window title
- play / pause shortcut
- next button shortcut
- previous button shortcut
- random button shortcut
- loop button shortcut
- -5 / +5 second shortcut
- 0 to 9 song position shortcuts
- mute / unmute volume
#### FIXED
- playlist wrong initializing when clicking on song when random
- playlist wrong initializing when clicking on song when loop
- playlist wrong initializing when clicking on song when loop and random
- don't check for new version if the user is offline
- app can only be opened once at the time
- next button not working when no music playing
- tab effect
- checkboxes not working
- playing a playlist with 0 songs

## HEKO-2.0.4
#### ADDED
- window tab song controls
- display current song
- display song duration
- updating song current time
- updating song slider position
- song slider set current time

## HEKO-2.0.3
#### ADDED
- remove song from playlist
- add song to other playlist contextmenu
- add song to playlist shortcut
- add song to playlist contextmenu
- edit song from app
- song filter in current playlist
- current playlist song conatiner sort (id, name, artist, duration) (also in reverse) 
- play / pause button
- random button
- loop button
- next song button
- previous song playing button
- save / load loop, random and volume
- song playing
#### FIXED
- song filter not working in "adding song to playlist" modal

## HEKO-2.0.2
#### ADDED
- remove song from app
- add song to playlist
#### FIXED
- open correct playlist when refreshing after an operation
- frame buttons not working
- window position and size not saving

## HEKO-2.0.1
#### ADDED
- duplicate playlist
- move playlist
- contextmenu recusrsive child system
- contextmenu shortcuts
- add song to app
#### FIXED
- modal message not centered
- modal message on one line
- errors in reading & writing json file not showing (console)
- success message showing when reading or writing errors

## HEKO-2.0.0
#### REMAKE CODE FROM SCRATCH
#### ADDED
- playlists
- create playlist
- remove playlist
- rename playlist
- contextmenu





## HEKO-1.2.14
#### FIXED
- optimized song duration loading time when opening a playlist

## HEKO-1.2.13
#### FIXED
- window negative position

## HEKO-1.2.12
#### ADDED
- window title is equal to playing song's name

## HEKO-1.2.11
#### ADDED
- escape shortcut to reset song search filter

## HEKO-1.2.10
#### FIXED
- reseting sort when opening playlist

## HEKO-1.2.9
#### FIXED
- first song is random when random
- playing same song in a row after a refresh

## HEKO-1.2.8
#### ADDED
- save filter

## HEKO-1.2.7
#### ADDED
- save sort
#### FIXED
- only check for new version when opening app

## HEKO-1.2.6
#### FIXED
- playlist open / close state saving

## HEKO-1.2.5
#### ADDED
- arrow for volume control
- scroll in playback rate menu
- playlist open / close state saving
#### FIXED
- playlist duration not reseting when opening a playlist
- unique playlist id

## HEKO-1.2.4
#### ADDED
- playlist duration

## HEKO-1.2.3
#### ADDED
- new version detection
- playback rate setting
#### FIXED
- queue bug when adding a new song to the app if shiffle or loop
- file name display in add song to app modal

## HEKO-1.2.2
#### ADDED
- queue visualizer
#### FIXED
- success / error display
- contextmenu display neer edges

## HEKO-1.2.1
#### ADDED
- instant playlist opening when refreshing
#### FIXED
- loop specific song

## HEKO-1.2.0
#### MODIFIED
- arrow shortcut is now for current song time controls
#### ADDED
- ctrl + arrow for previous or next song
- 0 to 9 shortcuts for other current song time controls
- add to playlist in current playlist songs's contextmenu 
- song edit
- song edit in current playlist song's contextmenu

## HEKO-1.1.15
#### ADDED
- visual for when a file has been dropped
- notification when adding a song to queue manually
#### FIXED
- extended modal inner padding
- queue saving when refreshing
- tab in modals

## HEKO-1.1.14
#### FIXED
- save the timestamp for each song play

## HEKO-1.1.13
#### ADDED
- save the number of plays for each song
#### FIXED
- removing song from app while listening to it
- song h&ve now unique id

## HEKO-1.1.12
#### ADDED
- controls buttons in task bar hover menu
- show which song is playing in current playlist
#### FIXED
- playing correct song when clicking on a song when random is enabled
- added to queue when refreshing
- save pause status when refreshing
- error HK-303 display

## HEKO-1.1.11
#### FIXED
- playing correct song when clicking on a song when random is enabled

## HEKO-1.1.10
#### ADDED
- error naming system
- scroll on volume
- save current data when refreshing
#### FIXED
- window frame accessible when inside a modal
- queue system
- window maximize saving

## HEKO-1.1.9
#### ADDED
- mute toggle when clicking on song volume logo
- m shortcut for toggle mute
- drag zone for add song to app modal
#### FIXED
- playlist container wont scroll
- add song to app modal not closing when clicking on edges
- only song files are accepted
#### REMOVED
- auto filter input blur when opening a playlist

## HEKO-1.1.8
#### ADDED
- changes open in browser when clicking on window title
- song filter in current playlist
- sort current playlist songs by id, title, artist and duration
#### FIXED
- hover on song in current playlist when right clicking it

## HEKO-1.1.7
#### ADDED
- main color on song hover in current playlist
- hover popup
#### FIXED
- text overflow in current playlist song list
- text overflow on current playlist title
- random and loop not working when switching playlist
- right click on unvalid songs
- removed "Move to" contextmenu on playlist that can't be moved
- random when loop is being disabled
- window maximize saving

## HEKO-1.1.6
#### ADDED
- software name and version in frame
- duplicate playlist
- shade not working songs
#### FIXED
- save window location
- can't play shaded songs

## HEKO-1.1.5
#### ADDED
- blur background when a modal is open
- changed colors

## HEKO-1.1.4
#### FIXED
- volume saving
- file add
- song can't have same names
- enter key event in modals

## HEKO-1.1.3
#### ADDED
- save random, loop and volume
- save window size and position
- remove songs from app

## HEKO-1.1.2
#### ADDED
- remove playlist shortcut
- rename playlist shortcut
#### FIXED
- song list in add song to a playlist
- drag file detection only for files
- can only drop audio files when adding song to app
- anti spam confirm buttons

## HEKO-1.1.1
#### FIXED
- no playlist created
- song list memorizing choices

## HEKO-1.1.0
#### ADDED
- add song to playlist button
- manage song button and menu
- add song to app
#### FIXED
- add song to playlist modal checkboxs not working
- contextmenu out of window

## HEKO-1.0.5
#### ADDED
- add song to playlist
- remove song from playlist
#### FIXED
- shortcuts working when a modal in opened
- error modal not opening

## HEKO-1.0.4
#### ADDED
- add song to queue
- shortcut indication in context menus
- create playlist button
- playlist open / close animation
#### FIXED
- visual bug when resizing window's height
- root proposition in playlists context menu when already at root
- playing empty playlist

## HEKO-1.0.3
#### ADDED
- rename playlist
#### FIXED
- removing parent playlist

## HEKO-1.0.2
#### ADDED
- move playlist
- remove playlist
- arrow on playlists that contains other playlists

## HEKO-1.0.1
#### ADDED
- line between table head and table body on current playlist song list
- current song details in footer
- context menus
#### FIXED
- play / pause button when listening a song by clicking one on the current playlist
- scroll bar in current playlist song list
- red color for closing window button

## HEKO-1.0.0
#### ADDED
- sogn queue system
- shuffle playlist
- loop current song
- previous song
- next song
- play song
- pasue song
- song slider
- volume slider
- playlists list
- current playlist song list
- parent playlist system