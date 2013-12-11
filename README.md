## Synopsis

MongoCMS is just a very simple content editor for mongodb collections. It makes manging rich content types very simple, clean and elegant. 
![](https://raw.github.com/digitalmaster/MongoCMS/master/img/screenshots/doc-edit.png)
## Motivation

My primary motivation for building this tool was my personal blog (www.josebrowne.com). My process for updating HTML content was very painfull (encode, decode, encode, decode..etc). Manually adding dates was also suprisingly tricky (ex ISODate("2011-04-24T09:00:00.000Z"). I tried EVERY tool out there and none solved this problem for me. I had two weeks off so I decided to give it a shot.

## Features
- Connect to local and Remote collections
![](https://raw.github.com/digitalmaster/MongoCMS/master/img/screenshots/connect.png)
- Inline editing
- Create/Delete documents
- Create/Update/Edit or Delete data
- Support for nested fields
- Easy breadcrumbs navigation for nested data
- Inline HTMl editing (with ace)
![](https://raw.github.com/digitalmaster/MongoCMS/master/img/screenshots/ace-editor.png)
- Easy date inputs (using HTML5 datetime input type)

More features coming soon..

# Getting Started

### Download
- OSX: [Download v0.01](http://s395965318.onlinehome.us/mongocms/0.1/osx/MongoCMS_osx_v0.1.tar.bz2)
- Win: (Just needs to be packaged)
- Linux : (Just needs to be packaged) 

### Connect
You can connect to bot local (mongod) instances as well as remote databases. For local connections the only required fields are **HOST** and **database**. Once connected select your collection from the list and you're good to go.


### Editing Changes
MongoCMS currently supports full CRUD operations on Collections and Documents. Simply select or create a document in document list on left then begin making inline edits. To save changes simple blur (click outisde of inputs). 


## TODO next

- Create connection manager (right now just stores last credentials in localStorage)
- Implement AMD (ex. require.js)
- Infinite Scroll for Document list
- Add "create collection" feature to connect dialog
- Edit keys
- Reduce package file size

The HTML5 stack makes it very easy for many developers to contribute so if you have any other suggestions feel free to create a feature request. 

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`) 
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

The MIT License (MIT)

Copyright (c) 2013 Jose Browne &lt;josebrowne@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/digitalmaster/mongocms/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

